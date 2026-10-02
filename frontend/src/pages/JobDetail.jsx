import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Badge, ScoreBar, Spinner, Empty } from '../components/UI';
import { Plus, Trash2, Upload, X, ChevronLeft, Loader2, CheckCircle, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── CRITERIA PANEL ───────────────────────────────────────────────────────────
function CriteriaPanel({ jobId, criteria, setCriteria }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('Required');
  const [category, setCategory] = useState('Skills');
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try {
      const c = await api.addCriterion(jobId, { text, type, category });
      setCriteria(cs => [...cs, c]);
      setText('');
      toast.success('Criterion added');
    } catch (err) { toast.error(err.message); }
    finally { setAdding(false); }
  };

  const remove = async (id) => {
    await api.deleteCriterion(id);
    setCriteria(cs => cs.filter(c => c.id !== id));
    toast.success('Criterion removed');
  };

  const typeColor = { Required: 'badge-req', Preferred: 'badge-pref', Bonus: 'badge-bonus' };

  return (
    <Card style={{ marginBottom: '1.25rem' }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
        Hiring Criteria <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text3)' }}>({criteria.length})</span>
      </h2>

      {criteria.length === 0 && <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: '1rem' }}>No criteria yet — add some below.</div>}

      <div style={{ marginBottom: criteria.length ? '1rem' : 0 }}>
        {criteria.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{c.text}</span>
            <Badge type={c.category === 'Skills' ? undefined : undefined} />
            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text2)', fontWeight: 500 }}>{c.category}</span>
            <Badge type={c.type} />
            <button onClick={() => remove(c.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 2 }}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: criteria.length ? '1rem' : 0, borderTop: criteria.length ? '1px solid var(--border)' : 'none' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>New criterion</label>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. 5+ years React experience" style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={type} onChange={e => setType(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}>
            <option>Required</option><option>Preferred</option><option>Bonus</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}>
            <option>Skills</option><option>Experience</option><option>Education</option><option>Soft skills</option><option>Certifications</option><option>Other</option>
          </select>
          <button onClick={add} disabled={adding || !text.trim()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !text.trim() ? 0.5 : 1 }}>
            {adding ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} Add
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────
function UploadModal({ jobId, onClose, onDone }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cvText, setCvText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef();

  const submit = async () => {
    if (!name.trim()) return toast.error('Applicant name required');
    if (!cvText.trim() && !file) return toast.error('Provide CV text or upload a file');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      if (file) fd.append('cv', file);
      else fd.append('cv_text', cvText);
      const res = await api.uploadCV(jobId, fd);
      setResult(res);
      onDone();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  if (result) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>
            {result.tier === 'strong' ? '🎯' : result.tier === 'partial' ? '⚡' : '❌'}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Analysis complete</h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1.25rem' }}>{name} scored <strong style={{ color: result.score >= 75 ? 'var(--success)' : result.score >= 50 ? 'var(--warn)' : 'var(--danger)' }}>{result.score}%</strong> — <Badge type={result.tier} /></p>
          <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,81,248,.2)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--text)', textAlign: 'left', lineHeight: 1.6, marginBottom: '1rem' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={11} /> AI Summary</div>
            {result.analysis?.summary}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'none', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' }}>Done</button>
            <button onClick={() => { setResult(null); setName(''); setEmail(''); setCvText(''); setFile(null); }} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
              Add another
            </button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <Card style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>Add applicant</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="applicant@email.com" style={{ width: '100%', padding: '8px 11px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
            </div>
          </div>

          {/* File upload */}
          <div onClick={() => fileRef.current.click()} style={{ border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '1.25rem', textAlign: 'center', cursor: 'pointer', background: file ? 'var(--accent-light)' : 'var(--surface1)', transition: 'all .15s' }}>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setCvText(''); }} />
            <Upload size={20} color={file ? 'var(--accent)' : 'var(--text3)'} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, color: file ? 'var(--accent)' : 'var(--text2)', fontWeight: file ? 500 : 400 }}>{file ? file.name : 'Upload PDF or text file'}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Click to browse</div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>— or paste CV text —</div>

          <div>
            <textarea value={cvText} onChange={e => { setCvText(e.target.value); setFile(null); }} rows={6} placeholder="Paste the full CV / resume text here..." style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none', resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'none', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text2)' }}>Cancel</button>
            <button onClick={submit} disabled={loading} style={{ flex: 2, padding: '9px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing with AI…</> : <><Sparkles size={14} /> Analyze CV</>}
            </button>
          </div>
        </div>
      </Card>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── APPLICANT DETAIL SIDE PANEL ──────────────────────────────────────────────
function ApplicantPanel({ applicantId, onClose, onStatusChange }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getApplicant(applicantId).then(setData);
  }, [applicantId]);

  const setStatus = async (status) => {
    await api.updateStatus(applicantId, status);
    setData(d => ({ ...d, status }));
    onStatusChange(applicantId, status);
  };

  const statusIcon = { pass: <CheckCircle size={15} color="var(--success)" />, partial: <AlertCircle size={15} color="var(--warn)" />, fail: <XCircle size={15} color="var(--danger)" /> };

  if (!data) return (
    <div style={{ width: 380, borderLeft: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner />
    </div>
  );

  const analysis = data.analysis || {};
  const color = data.score >= 75 ? 'var(--success)' : data.score >= 50 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div style={{ width: 380, borderLeft: '1px solid var(--border)', background: 'var(--surface)', overflow: 'auto', flexShrink: 0 }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{data.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{data.email || 'No email'}</div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={16} /></button>
      </div>

      <div style={{ padding: '1.25rem' }}>
        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: '1.25rem', padding: '1rem', background: 'var(--surface1)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{data.score}%</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>match score</div>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}><Badge type={data.tier} /></div>
            <div><Badge type={data.status} /></div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
          {['shortlisted','reviewed','rejected'].map(s => (
            <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, padding: '6px 4px', border: `1px solid ${data.status === s ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: data.status === s ? 'var(--accent-light)' : 'none', color: data.status === s ? 'var(--accent)' : 'var(--text2)', fontSize: 11, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', transition: 'all .12s', textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>

        {/* Criteria results */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' }}>Criteria breakdown</div>
          {analysis.criteria_results?.map((cr, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ marginTop: 1, flexShrink: 0 }}>{statusIcon[cr.status] || statusIcon.fail}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{cr.reason}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Gaps */}
        {analysis.strengths?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Strengths</div>
            {analysis.strengths.map((s, i) => <div key={i} style={{ fontSize: 12, color: 'var(--success)', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}><CheckCircle size={12} style={{ marginTop: 2, flexShrink: 0 }} />{s}</div>)}
          </div>
        )}
        {analysis.gaps?.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Gaps</div>
            {analysis.gaps.map((g, i) => <div key={i} style={{ fontSize: 12, color: 'var(--danger)', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: 6 }}><XCircle size={12} style={{ marginTop: 2, flexShrink: 0 }} />{g}</div>)}
          </div>
        )}

        {/* AI Summary */}
        {analysis.summary && (
          <div style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,81,248,.15)', borderRadius: 'var(--radius)', padding: '10px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={11} /> AI Summary</div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{analysis.summary}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN JOB DETAIL PAGE ─────────────────────────────────────────────────────
export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    const [jobs, crits, apps] = await Promise.all([
      api.getJobs(),
      api.getCriteria(id),
      api.getApplicants(id),
    ]);
    setJob(jobs.find(j => j.id === id));
    setCriteria(crits);
    setApplicants(apps);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const filtered = applicants.filter(a => {
    if (tab !== 'all' && a.tier !== tab && a.status !== tab) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = (appId, status) => {
    setApplicants(as => as.map(a => a.id === appId ? { ...a, status } : a));
  };

  const deleteApplicant = async (appId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this applicant?')) return;
    await api.deleteApplicant(appId);
    setApplicants(as => as.filter(a => a.id !== appId));
    if (selectedApplicant === appId) setSelectedApplicant(null);
    toast.success('Applicant deleted');
  };

  if (loading) return <div style={{ padding: '2rem' }}><Spinner /></div>;
  if (!job) return <div style={{ padding: '2rem', color: 'var(--text2)' }}>Job not found.</div>;

  const tabs = [
    { key: 'all', label: `All (${applicants.length})` },
    { key: 'strong', label: `Strong (${applicants.filter(a => a.tier === 'strong').length})` },
    { key: 'partial', label: `Partial (${applicants.filter(a => a.tier === 'partial').length})` },
    { key: 'weak', label: `Weak (${applicants.filter(a => a.tier === 'weak').length})` },
    { key: 'shortlisted', label: `Shortlisted (${applicants.filter(a => a.status === 'shortlisted').length})` },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.5rem', fontSize: 13, color: 'var(--text2)' }}>
          <Link to="/my-jobs" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text2)', textDecoration: 'none' }}><ChevronLeft size={14} /> Jobs</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{job.title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{job.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{job.department || 'No department'} · Shortlist threshold: {job.min_score}%</p>
          </div>
          <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <Upload size={14} /> Add applicant
          </button>
        </div>

        <CriteriaPanel jobId={id} criteria={criteria} setCriteria={setCriteria} />

        {/* Applicants */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginRight: 'auto' }}>Applicants</h2>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…" style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 12, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none', width: 160 }} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 12px', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`, background: 'none', fontSize: 12, fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? 'var(--accent)' : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1, transition: 'all .12s' }}>{t.label}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Empty icon="👤" text="No applicants yet" sub={criteria.length ? 'Click "Add applicant" to upload a CV' : 'Add criteria first, then upload CVs'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {filtered.map((a, i) => (
                <div key={a.id} onClick={() => setSelectedApplicant(a.id === selectedApplicant ? null : a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 8, cursor: 'pointer', background: selectedApplicant === a.id ? 'var(--accent-light)' : 'transparent', transition: 'background .12s', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ width: 100 }}><ScoreBar score={a.score ?? 0} /></div>
                  <Badge type={a.tier} />
                  <Badge type={a.status} />
                  <button onClick={e => deleteApplicant(a.id, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex', flexShrink: 0 }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Side panel */}
      {selectedApplicant && (
        <ApplicantPanel applicantId={selectedApplicant} onClose={() => setSelectedApplicant(null)} onStatusChange={handleStatusChange} />
      )}

      {showUpload && <UploadModal jobId={id} onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); load(); }} />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
