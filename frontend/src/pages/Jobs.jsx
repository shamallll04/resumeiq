import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Spinner, Empty } from '../components/UI';
import { Plus, Briefcase, Users, ChevronRight, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

function NewJobModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
  title: "",
  department: "",
  description: "",
  location: "",
  employment_type: "Full Time",
  work_mode: "Remote",
  experience: "",
  salary: "",
  education: "",
  min_score: 70
});
  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const job = await api.createJob(form);
      onCreate(job);
      onClose();
      toast.success('Job posting created');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>New job posting</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)' }}><X size={18} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Job title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="Senior Frontend Engineer" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Department</label>
            <input value={form.department} onChange={set('department')} placeholder="Engineering" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Brief role description..." style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Minimum shortlist score (%)</label>
            <input type="number" min={0} max={100} value={form.min_score} onChange={set('min_score')} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'none', fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--text2)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '8px 18px', border: 'none', borderRadius: 'var(--radius)', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating…' : 'Create posting'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.getJobs().then(setJobs).finally(() => setLoading(false));
  }, []);

  const deleteJob = async (id, e) => {
    e.preventDefault();
    if (!confirm('Delete this job posting and all its applicants?')) return;
    await api.deleteJob(id);
    setJobs(j => j.filter(x => x.id !== id));
    toast.success('Job deleted');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Job Postings</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage your open roles and their hiring criteria.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={15} /> New job
        </button>
      </div>

      {loading ? <Spinner /> : jobs.length === 0 ? (
        <Card>
          <Empty icon="💼" text="No job postings yet" sub="Create your first posting to start screening candidates" />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
              <Card style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .15s', ':hover': { borderColor: 'var(--accent)' } }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ width: 42, height: 42, background: 'var(--accent-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{job.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{job.department || 'No department'} · {job.criteria_count} criteria</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>
                  <Users size={13} /> {job.applicant_count} applicants
                </div>
                {job.avg_score && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', flexShrink: 0 }}>
                    Avg <strong style={{ color: 'var(--text)' }}>{Math.round(job.avg_score)}%</strong>
                  </div>
                )}
                <button onClick={e => deleteJob(job.id, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, display: 'flex' }} title="Delete">
                  <Trash2 size={14} />
                </button>
                <ChevronRight size={16} color="var(--text3)" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showModal && <NewJobModal onClose={() => setShowModal(false)} onCreate={j => setJobs(jobs => [j, ...jobs])} />}
    </div>
  );
}
