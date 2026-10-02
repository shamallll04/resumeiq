import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, Briefcase, MapPin, ArrowLeft, Upload, Loader2, CheckCircle, Sparkles } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function apiFetch(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error');
  return data;
}

// ─── JOB BOARD LIST ───────────────────────────────────────────────────────────
export function PublicJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/public/jobs').then(setJobs).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e3f5', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 30, height: 30, background: '#5b51f8', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1830' }}>ResumeIQ Jobs</span>
        </Link>
        <Link to="/login" style={{ fontSize: 13, color: '#5b51f8', fontWeight: 500, textDecoration: 'none' }}>Company login →</Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1830', marginBottom: 4 }}>Open positions</h1>
        <p style={{ fontSize: 13, color: '#6b6895', marginBottom: '1.5rem' }}>Apply directly — your CV will be AI-screened instantly</p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a09dc0' }}>Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a09dc0' }}>No open positions right now.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}/apply`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#5b51f8'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e3f5'}>
                  <div style={{ width: 44, height: 44, background: '#eeedfe', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={20} color="#5b51f8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1830' }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: '#6b6895', marginTop: 2 }}>{job.company_name} · {job.department || 'General'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#5b51f8', fontWeight: 500 }}>Apply →</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APPLY PAGE ───────────────────────────────────────────────────────────────
export function ApplyPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', cv_text: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/public/jobs/${id}`).then(setJob).catch(() => setError('Job not found'));
  }, [id]);

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name is required');
    if (!form.cv_text.trim() && !file) return setError('Please paste your CV or upload a file');
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      if (file) fd.append('cv', file);
      else fd.append('cv_text', form.cv_text);
      const res = await fetch(`${BASE}/public/jobs/${id}/apply`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  if (error && !job) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>😕</div>
        <div style={{ fontSize: 16, color: '#1a1830', fontWeight: 600 }}>{error}</div>
        <Link to="/jobs" style={{ color: '#5b51f8', fontSize: 13, marginTop: 8, display: 'block' }}>← Back to jobs</Link>
      </div>
    </div>
  );

  if (!job) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#a09dc0' }}>Loading…</div>;

  if (result) return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '1rem' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 20, padding: '2.5rem', maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>
          {result.tier === 'strong' ? '🎯' : result.tier === 'partial' ? '⚡' : '📋'}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1830', marginBottom: 6 }}>Application submitted!</h2>
        <p style={{ fontSize: 13, color: '#6b6895', marginBottom: '1.25rem' }}>
          Your CV matched <strong style={{ color: result.score >= 75 ? '#16a34a' : result.score >= 50 ? '#d97706' : '#dc2626' }}>{result.score}%</strong> of the job criteria.
        </p>
        <div style={{ background: '#eeedfe', border: '1px solid rgba(91,81,248,.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#1a1830', textAlign: 'left', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5b51f8', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} /> AI Feedback
          </div>
          {result.summary}
        </div>
        <div style={{ fontSize: 13, color: '#6b6895', marginBottom: '1.25rem' }}>
          The hiring team will review your application and reach out if you're selected.
        </div>
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#5b51f8', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Browse more jobs
        </Link>
      </div>
    </div>
  );

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e5e3f5', borderRadius: 8, fontSize: 13, fontFamily: 'Inter, sans-serif', background: '#f8f7ff', color: '#1a1830', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e3f5', padding: '1rem 2rem' }}>
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6895', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to jobs
        </Link>
      </nav>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Job info */}
        <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1830', marginBottom: 4 }}>{job.title}</div>
          <div style={{ fontSize: 13, color: '#6b6895' }}>{job.company_name} · {job.department || 'General'}</div>
          {job.description && <div style={{ fontSize: 13, color: '#1a1830', marginTop: 10, lineHeight: 1.6 }}>{job.description}</div>}
        </div>

        {/* Apply form */}
        <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1.5rem' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1a1830', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#5b51f8" /> Apply — your CV will be AI-screened instantly
          </h2>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6895', display: 'block', marginBottom: 4 }}>Full name *</label>
                <input style={inp} value={form.name} onChange={setF('name')} placeholder="Your full name" required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6895', display: 'block', marginBottom: 4 }}>Email</label>
                <input style={inp} type="email" value={form.email} onChange={setF('email')} placeholder="your@email.com" />
              </div>
            </div>

            {/* File upload */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6895', display: 'block', marginBottom: 4 }}>Upload CV (PDF)</label>
              <div onClick={() => document.getElementById('cv-file').click()}
                style={{ border: `2px dashed ${file ? '#5b51f8' : '#e5e3f5'}`, borderRadius: 8, padding: '1rem', textAlign: 'center', cursor: 'pointer', background: file ? '#eeedfe' : '#f8f7ff' }}>
                <input id="cv-file" type="file" accept=".pdf,.txt" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setForm(f => ({ ...f, cv_text: '' })); }} />
                <Upload size={18} color={file ? '#5b51f8' : '#a09dc0'} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 12, color: file ? '#5b51f8' : '#6b6895', fontWeight: file ? 500 : 400 }}>{file ? file.name : 'Click to upload PDF'}</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#a09dc0' }}>— or paste CV text —</div>

            <div>
              <textarea style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }}
                value={form.cv_text} onChange={e => { setF('cv_text')(e); setFile(null); }}
                placeholder="Paste your full CV / resume text here..." />
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#b91c1c' }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ padding: '11px', background: '#5b51f8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing your CV…</> : <><CheckCircle size={16} /> Submit application</>}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
