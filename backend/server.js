import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import Groq from 'groq-sdk';
import { getDb, all, get, run } from './db.js';
import { signToken, auth } from './auth.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function askAI(prompt) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 1500,
  });
  return completion.choices[0].message.content;
}

// ─── PLANS & LIMITS ───────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:       { jobs: 3,        cvsPerMonth: 50,       publicBoard: false },
  pro:        { jobs: Infinity, cvsPerMonth: 500,      publicBoard: true  },
  enterprise: { jobs: Infinity, cvsPerMonth: Infinity, publicBoard: true  },
};
const PLAN_PRICES = { pro: 99900, enterprise: 299900 }; // paise (INR)
const PLAN_DAYS = 30;
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// A paid plan that has expired counts as free
function effectivePlan(user) {
  if (!user) return 'free';
  const plan = PLAN_LIMITS[user.plan] ? user.plan : 'free';
  if (plan !== 'free' && user.plan_expires_at && new Date(user.plan_expires_at) < new Date()) return 'free';
  return plan;
}

function planOf(db, userId) {
  return effectivePlan(get(db, 'SELECT plan, plan_expires_at FROM users WHERE id=?', [userId]));
}

const monthKey = () => new Date().toISOString().slice(0, 7);

function getUsage(db, userId) {
  const row = get(db, 'SELECT cvs FROM usage WHERE user_id=? AND month=?', [userId, monthKey()]);
  return row ? Number(row.cvs) : 0;
}

// Usage is a counter, not a row count, so deleting applicants can't reset the quota
function addUsage(db, userId) {
  run(db, `INSERT INTO usage (user_id, month, cvs) VALUES (?,?,1)
           ON CONFLICT(user_id, month) DO UPDATE SET cvs = cvs + 1`, [userId, monthKey()]);
}

function limitError(res, message) {
  return res.status(403).json({ error: message, code: 'PLAN_LIMIT' });
}

// Returns an error message if the owner can't analyze another CV this month
function cvQuotaError(db, userId) {
  const plan = planOf(db, userId);
  const max = PLAN_LIMITS[plan].cvsPerMonth;
  if (getUsage(db, userId) >= max)
    return `Monthly limit of ${max} CVs reached on the ${plan} plan. Upgrade to analyze more.`;
  return null;
}

// SQL fragment: job owner currently has a paid, non-expired plan
const PAID_OWNER = "u.plan IN ('pro','enterprise') AND (u.plan_expires_at IS NULL OR u.plan_expires_at > ?)";

// Public apply is unauthenticated and each call costs an AI request: cap per IP
const applyHits = new Map();
setInterval(() => applyHits.clear(), 60 * 60 * 1000).unref();
function applyRateLimit(req, res, next) {
  const now = Date.now();
  const hits = (applyHits.get(req.ip) || []).filter(t => now - t < 60 * 60 * 1000);
  if (hits.length >= 5)
    return res.status(429).json({ error: 'Too many applications from this connection. Try again later.' });
  hits.push(now);
  applyHits.set(req.ip, hits);
  next();
}

const app = express();
app.set('trust proxy', 1);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const cors = require("cors")
app.use(express.json());

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const db = await getDb();
  const { email, password, company_name } = req.body;
  if (!email || !password || !company_name)
    return res.status(400).json({ error: 'All fields required' });
  const existing = get(db, 'SELECT id FROM users WHERE email=?', [email.toLowerCase()]);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const password_hash = await bcrypt.hash(password, 10);
  const id = uuid();
  run(db, 'INSERT INTO users (id,email,password_hash,company_name,plan) VALUES (?,?,?,?,?)',
    [id, email.toLowerCase(), password_hash, company_name, 'free']);
  const token = signToken({ id, email, company_name });
  res.json({ token, user: { id, email, company_name, plan: 'free' } });
});

app.post('/api/auth/login', async (req, res) => {
  const db = await getDb();
  const { email, password } = req.body;
  const user = get(db, 'SELECT * FROM users WHERE email=?', [email?.toLowerCase()]);
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid email or password' });
  const token = signToken({ id: user.id, email: user.email, company_name: user.company_name });
  res.json({ token, user: { id: user.id, email: user.email, company_name: user.company_name, plan: effectivePlan(user) } });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const db = await getDb();
  const user = get(db, 'SELECT id,email,company_name,plan,plan_expires_at,created_at FROM users WHERE id=?', [req.user.id]);
  if (user) user.plan = effectivePlan(user);
  res.json(user);
});

// ─── JOBS ─────────────────────────────────────────────────────────────────────

app.get('/api/jobs', auth, async (req, res) => {
  const db = await getDb();
  const jobs = all(db, `SELECT j.*,
    (SELECT COUNT(*) FROM criteria WHERE job_id=j.id) as criteria_count,
    (SELECT COUNT(*) FROM applicants WHERE job_id=j.id) as applicant_count,
    (SELECT AVG(score) FROM applicants WHERE job_id=j.id) as avg_score
    FROM job_postings j WHERE j.user_id=? ORDER BY j.created_at DESC`, [req.user.id]);
  res.json(jobs);
});

app.post('/api/jobs', auth, async (req, res) => {
  const db = await getDb();
  const { title, department, description, min_score, is_public } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const plan = planOf(db, req.user.id);
  const lim = PLAN_LIMITS[plan];
  const count = Number(get(db, 'SELECT COUNT(*) as n FROM job_postings WHERE user_id=?', [req.user.id]).n);
  if (count >= lim.jobs)
    return limitError(res, `The ${plan} plan allows ${lim.jobs} job postings. Upgrade to add more.`);
  if (is_public && !lim.publicBoard)
    return limitError(res, 'The public job board is available on Pro and Enterprise plans.');
  const id = uuid();
  run(db, 'INSERT INTO job_postings (id,user_id,title,department,description,min_score,is_public) VALUES (?,?,?,?,?,?,?)',
    [id, req.user.id, title, department || '', description || '', min_score || 70, is_public ? 1 : 0]);
  res.json(get(db, 'SELECT * FROM job_postings WHERE id=?', [id]));
});

app.put('/api/jobs/:id', auth, async (req, res) => {
  const db = await getDb();
  const job = get(db, 'SELECT * FROM job_postings WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!job) return res.status(404).json({ error: 'Not found' });
  const { title, department, description, min_score, is_public } = req.body;
  if (is_public && !PLAN_LIMITS[planOf(db, req.user.id)].publicBoard)
    return limitError(res, 'The public job board is available on Pro and Enterprise plans.');
  run(db, 'UPDATE job_postings SET title=?,department=?,description=?,min_score=?,is_public=? WHERE id=?',
    [title||job.title, department??job.department, description??job.description, min_score??job.min_score, is_public !== undefined ? (is_public ? 1 : 0) : job.is_public, job.id]);
  res.json(get(db, 'SELECT * FROM job_postings WHERE id=?', [job.id]));
});

app.delete('/api/jobs/:id', auth, async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM applicants WHERE job_id=?', [req.params.id]);
  run(db, 'DELETE FROM criteria WHERE job_id=?', [req.params.id]);
  run(db, 'DELETE FROM job_postings WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ─── PUBLIC JOB BOARD ─────────────────────────────────────────────────────────

app.get('/api/public/jobs', async (req, res) => {
  const db = await getDb();
  const jobs = all(db, `SELECT j.id, j.title, j.department, j.description, j.created_at, u.company_name
    FROM job_postings j JOIN users u ON u.id=j.user_id
    WHERE j.is_public=1 AND ${PAID_OWNER} ORDER BY j.created_at DESC`, [new Date().toISOString()]);
  res.json(jobs);
});

app.get('/api/public/jobs/:id', async (req, res) => {
  const db = await getDb();
  const job = get(db, `SELECT j.*, u.company_name FROM job_postings j
    JOIN users u ON u.id=j.user_id WHERE j.id=? AND j.is_public=1 AND ${PAID_OWNER}`, [req.params.id, new Date().toISOString()]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const criteria = all(db, 'SELECT * FROM criteria WHERE job_id=? ORDER BY sort_order', [req.params.id]);
  res.json({ ...job, criteria });
});

// Public CV submission
app.post('/api/public/jobs/:id/apply', applyRateLimit, upload.single('cv'), async (req, res) => {
  const db = await getDb();
  const job = get(db, `SELECT j.*, u.company_name FROM job_postings j
    JOIN users u ON u.id=j.user_id WHERE j.id=? AND j.is_public=1 AND ${PAID_OWNER}`, [req.params.id, new Date().toISOString()]);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  let cvText = '';
  const file = req.file;
  if (file) {
    if (file.mimetype === 'application/pdf') {
      try { const p = await pdfParse(file.buffer); cvText = p.text; }
      catch { return res.status(400).json({ error: 'Could not parse PDF' }); }
    } else { cvText = file.buffer.toString('utf-8'); }
  } else if (req.body.cv_text) {
    cvText = req.body.cv_text;
  } else {
    return res.status(400).json({ error: 'No CV provided' });
  }

  const name = req.body.name || 'Unknown';
  const email = req.body.email || '';
  const criteriaList = all(db, 'SELECT * FROM criteria WHERE job_id=? ORDER BY sort_order', [job.id]);
  if (!criteriaList.length) return res.status(400).json({ error: 'No criteria set for this job' });
  if (cvQuotaError(db, job.user_id))
    return res.status(403).json({ error: 'This employer is not accepting new applications right now.' });

  const criteriaText = criteriaList.map((c, i) => `${i+1}. [${c.type.toUpperCase()}][${c.category}] ${c.text}`).join('\n');
  const prompt = `You are an expert HR analyst. Evaluate this CV for the role of "${job.title}" at ${job.company_name}.

HIRING CRITERIA:
${criteriaText}

CV TEXT:
${cvText}

Respond ONLY with valid JSON, no markdown:
{
  "score": <integer 0-100>,
  "tier": "<strong or partial or weak>",
  "criteria_results": [{ "index": 1, "status": "<pass or partial or fail>", "reason": "<one sentence>" }],
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "summary": "<2-3 sentence hiring verdict>"
}`;

  let analysis;
  try {
    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    analysis = JSON.parse(match[0]);
  } catch (e) {
    return res.status(500).json({ error: 'AI analysis failed: ' + e.message });
  }

  const id = uuid();
  run(db, `INSERT INTO applicants (id,job_id,name,email,cv_text,cv_filename,score,tier,analysis_json,status)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, job.id, name, email, cvText, file?.originalname||null, analysis.score, analysis.tier, JSON.stringify(analysis), 'pending']);
  addUsage(db, job.user_id);

  res.json({ id, score: analysis.score, tier: analysis.tier, summary: analysis.summary });
});

// ─── CRITERIA ─────────────────────────────────────────────────────────────────

app.get('/api/jobs/:jobId/criteria', auth, async (req, res) => {
  const db = await getDb();
  const job = get(db, 'SELECT id FROM job_postings WHERE id=? AND user_id=?', [req.params.jobId, req.user.id]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(all(db, 'SELECT * FROM criteria WHERE job_id=? ORDER BY sort_order', [req.params.jobId]));
});

app.post('/api/jobs/:jobId/criteria', auth, async (req, res) => {
  const db = await getDb();
  const job = get(db, 'SELECT id FROM job_postings WHERE id=? AND user_id=?', [req.params.jobId, req.user.id]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { text, type, category, weight } = req.body;
  if (!text || !type) return res.status(400).json({ error: 'text and type required' });
  const id = uuid();
  run(db, 'INSERT INTO criteria (id,job_id,text,type,category,weight) VALUES (?,?,?,?,?,?)',
    [id, req.params.jobId, text, type, category || 'Skills', weight || 1]);
  res.json(get(db, 'SELECT * FROM criteria WHERE id=?', [id]));
});

app.delete('/api/criteria/:id', auth, async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM criteria WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ─── APPLICANTS ───────────────────────────────────────────────────────────────

app.get('/api/jobs/:jobId/applicants', auth, async (req, res) => {
  const db = await getDb();
  const job = get(db, 'SELECT id FROM job_postings WHERE id=? AND user_id=?', [req.params.jobId, req.user.id]);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  let q = 'SELECT id,name,email,cv_filename,score,tier,status,created_at FROM applicants WHERE job_id=?';
  const params = [req.params.jobId];
  if (req.query.tier) { q += ' AND tier=?'; params.push(req.query.tier); }
  if (req.query.status) { q += ' AND status=?'; params.push(req.query.status); }
  if (req.query.search) { q += ' AND name LIKE ?'; params.push(`%${req.query.search}%`); }
  q += ' ORDER BY score DESC';
  res.json(all(db, q, params));
});

app.get('/api/applicants/:id', auth, async (req, res) => {
  const db = await getDb();
  const a = get(db, `SELECT a.* FROM applicants a
    JOIN job_postings j ON j.id=a.job_id WHERE a.id=? AND j.user_id=?`, [req.params.id, req.user.id]);
  if (!a) return res.status(404).json({ error: 'Not found' });
  if (a.analysis_json) a.analysis = JSON.parse(a.analysis_json);
  res.json(a);
});

app.patch('/api/applicants/:id/status', auth, async (req, res) => {
  const db = await getDb();
  const { status } = req.body;
  if (!['pending','reviewed','shortlisted','rejected'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  run(db, 'UPDATE applicants SET status=? WHERE id=?', [status, req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/applicants/:id', auth, async (req, res) => {
  const db = await getDb();
  run(db, 'DELETE FROM applicants WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ─── CV UPLOAD (company side) ─────────────────────────────────────────────────

app.post('/api/jobs/:jobId/upload', auth, upload.single('cv'), async (req, res) => {
  const db = await getDb();
  const job = get(db, 'SELECT * FROM job_postings WHERE id=? AND user_id=?', [req.params.jobId, req.user.id]);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  let cvText = '';
  const file = req.file;
  if (file) {
    if (file.mimetype === 'application/pdf') {
      try { const p = await pdfParse(file.buffer); cvText = p.text; }
      catch { return res.status(400).json({ error: 'Could not parse PDF' }); }
    } else { cvText = file.buffer.toString('utf-8'); }
  } else if (req.body.cv_text) {
    cvText = req.body.cv_text;
  } else {
    return res.status(400).json({ error: 'No CV provided' });
  }

  const name = req.body.name || 'Unknown Applicant';
  const email = req.body.email || '';
  const criteriaList = all(db, 'SELECT * FROM criteria WHERE job_id=? ORDER BY sort_order', [job.id]);
  if (!criteriaList.length) return res.status(400).json({ error: 'Add criteria to this job first' });
  const quotaMsg = cvQuotaError(db, job.user_id);
  if (quotaMsg) return limitError(res, quotaMsg);

  const criteriaText = criteriaList.map((c, i) => `${i+1}. [${c.type.toUpperCase()}][${c.category}] ${c.text}`).join('\n');
  const prompt = `You are an expert HR analyst. Evaluate this CV for the role of "${job.title}".

HIRING CRITERIA:
${criteriaText}

CV TEXT:
${cvText}

Respond ONLY with valid JSON, no markdown:
{
  "score": <integer 0-100>,
  "tier": "<strong or partial or weak>",
  "criteria_results": [{ "index": 1, "status": "<pass or partial or fail>", "reason": "<one sentence>" }],
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "summary": "<2-3 sentence hiring verdict>"
}`;

  let analysis;
  try {
    const raw = await askAI(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    analysis = JSON.parse(match[0]);
  } catch (e) {
    return res.status(500).json({ error: 'AI analysis failed: ' + e.message });
  }

  const id = uuid();
  run(db, `INSERT INTO applicants (id,job_id,name,email,cv_text,cv_filename,score,tier,analysis_json,status)
    VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, job.id, name, email, cvText, file?.originalname||null, analysis.score, analysis.tier, JSON.stringify(analysis), 'pending']);
  addUsage(db, job.user_id);

  res.json({ id, score: analysis.score, tier: analysis.tier, analysis });
});

// ─── PAYMENTS (Razorpay) ──────────────────────────────────────────────────────

app.post('/api/payments/create-order', auth, async (req, res) => {
  try {
    if (!RZP_KEY_ID || !RZP_KEY_SECRET)
      return res.status(503).json({ error: 'Online payments are not set up yet. Contact support to upgrade.' });
    const db = await getDb();
    const { plan } = req.body;
    const amount = PLAN_PRICES[plan];
    if (!amount) return res.status(400).json({ error: 'Invalid plan' });

    const rzp = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`).toString('base64'),
      },
      body: JSON.stringify({ amount, currency: 'INR', receipt: uuid().slice(0, 30), notes: { user_id: req.user.id, plan } }),
    });
    const order = await rzp.json();
    if (!rzp.ok) return res.status(502).json({ error: order?.error?.description || 'Could not create payment order' });

    run(db, 'INSERT INTO orders (id,user_id,plan,amount,status) VALUES (?,?,?,?,?)',
      [order.id, req.user.id, plan, amount, 'created']);
    res.json({ orderId: order.id, amount, currency: 'INR', plan, keyId: RZP_KEY_ID });
  } catch (e) {
    res.status(502).json({ error: 'Payment service unavailable: ' + e.message });
  }
});

app.post('/api/payments/verify', auth, async (req, res) => {
  try {
    if (!RZP_KEY_SECRET) return res.status(503).json({ error: 'Online payments are not set up yet.' });
    const db = await getDb();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: 'Missing payment details' });

    const order = get(db, 'SELECT * FROM orders WHERE id=? AND user_id=?', [razorpay_order_id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status === 'paid') return res.json({ ok: true, plan: order.plan }); // idempotent

    const expected = crypto.createHmac('sha256', RZP_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.status(400).json({ error: 'Payment verification failed' });

    // Renewing the same plan extends from its current expiry instead of losing days
    const user = get(db, 'SELECT plan, plan_expires_at FROM users WHERE id=?', [req.user.id]);
    const stillActive = effectivePlan(user) === order.plan && user.plan_expires_at;
    const base = stillActive ? new Date(user.plan_expires_at) : new Date();
    const expires = new Date(base.getTime() + PLAN_DAYS * 86400000).toISOString();

    run(db, 'UPDATE users SET plan=?, plan_expires_at=? WHERE id=?', [order.plan, expires, req.user.id]);
    run(db, "UPDATE orders SET status='paid', payment_id=? WHERE id=?", [razorpay_payment_id, order.id]);
    res.json({ ok: true, plan: order.plan, expires });
  } catch (e) {
    res.status(500).json({ error: 'Verification error: ' + e.message });
  }
});

// Current plan, limits and usage (for the UI)
app.get('/api/usage', auth, async (req, res) => {
  const db = await getDb();
  const user = get(db, 'SELECT plan, plan_expires_at FROM users WHERE id=?', [req.user.id]);
  const plan = effectivePlan(user);
  const lim = PLAN_LIMITS[plan];
  const cap = n => (Number.isFinite(n) ? n : null); // null = unlimited
  const jobs = Number(get(db, 'SELECT COUNT(*) as n FROM job_postings WHERE user_id=?', [req.user.id]).n);
  res.json({
    plan, expires: user?.plan_expires_at || null, publicBoard: lim.publicBoard,
    jobs: { used: jobs, limit: cap(lim.jobs) },
    cvs: { used: getUsage(db, req.user.id), limit: cap(lim.cvsPerMonth) },
  });
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'];
  if (secret !== ADMIN_SECRET) return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  const db = await getDb();
  const total_companies = all(db, 'SELECT COUNT(*) as n FROM users').map(r => r.n)[0] || 0;
  const total_jobs = all(db, 'SELECT COUNT(*) as n FROM job_postings').map(r => r.n)[0] || 0;
  const total_applicants = all(db, 'SELECT COUNT(*) as n FROM applicants').map(r => r.n)[0] || 0;
  const pro_users = all(db, "SELECT COUNT(*) as n FROM users WHERE plan='pro'").map(r => r.n)[0] || 0;
  res.json({ total_companies, total_jobs, total_applicants, pro_users });
});

app.get('/api/admin/companies', adminAuth, async (req, res) => {
  const db = await getDb();
  const companies = all(db, `SELECT u.id, u.email, u.company_name, u.plan, u.created_at,
    (SELECT COUNT(*) FROM job_postings WHERE user_id=u.id) as jobs,
    (SELECT COUNT(*) FROM applicants a JOIN job_postings j ON j.id=a.job_id WHERE j.user_id=u.id) as applicants
    FROM users u ORDER BY u.created_at DESC`);
  res.json(companies);
});

app.patch('/api/admin/companies/:id/plan', adminAuth, async (req, res) => {
  const db = await getDb();
  const { plan } = req.body;
  if (!PLAN_LIMITS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  run(db, 'UPDATE users SET plan=?, plan_expires_at=NULL WHERE id=?', [plan, req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/admin/companies/:id', adminAuth, async (req, res) => {
  const db = await getDb();
  const jobs = all(db, 'SELECT id FROM job_postings WHERE user_id=?', [req.params.id]);
  for (const j of jobs) {
    run(db, 'DELETE FROM applicants WHERE job_id=?', [j.id]);
    run(db, 'DELETE FROM criteria WHERE job_id=?', [j.id]);
  }
  run(db, 'DELETE FROM job_postings WHERE user_id=?', [req.params.id]);
  run(db, 'DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

app.get('/api/dashboard', auth, async (req, res) => {
  const db = await getDb();
  const jobs = all(db, 'SELECT id FROM job_postings WHERE user_id=?', [req.user.id]);
  const jobIds = jobs.map(j => `'${j.id}'`).join(',') || "''";
  const applicants = all(db, `SELECT * FROM applicants WHERE job_id IN (${jobIds})`);
  const scores = applicants.filter(a => a.score).map(a => Number(a.score));
  const recentApplicants = all(db, `SELECT a.id,a.name,a.score,a.tier,a.status,a.created_at,j.title as job_title
    FROM applicants a JOIN job_postings j ON j.id=a.job_id
    WHERE j.user_id=? ORDER BY a.created_at DESC LIMIT 8`, [req.user.id]);
  res.json({
    stats: {
      total_jobs: jobs.length,
      total_applicants: applicants.length,
      strong_matches: applicants.filter(a => a.tier === 'strong').length,
      shortlisted: applicants.filter(a => a.status === 'shortlisted').length,
      avg_score: scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null,
    },
    recentApplicants,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`ResumeIQ API running on :${PORT}`));
