import { useEffect, useState } from 'react';
import { Users, Briefcase, FileText, Star, Trash2, ChevronDown } from 'lucide-react';

const BASE = import.meta.env.VITE_API_URL || '/api';

export default function Admin() {
  const [secret, setSecret] = useState(localStorage.getItem('riq_admin') || '');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState('');

  const headers = { 'x-admin-secret': secret, 'Content-Type': 'application/json' };

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        fetch(`${BASE}/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${BASE}/admin/companies`, { headers }).then(r => r.json()),
      ]);
      if (s.error) { setError('Invalid admin secret'); return; }
      setStats(s); setCompanies(c); setAuthed(true);
      localStorage.setItem('riq_admin', secret);
    } catch { setError('Failed to connect'); }
  };

  const deleteCo = async (id) => {
    if (!confirm('Delete this company and all their data?')) return;
    await fetch(`${BASE}/admin/companies/${id}`, { method: 'DELETE', headers });
    setCompanies(cs => cs.filter(c => c.id !== id));
  };

  const setPlan = async (id, plan) => {
    await fetch(`${BASE}/admin/companies/${id}/plan`, { method: 'PATCH', headers, body: JSON.stringify({ plan }) });
    setCompanies(cs => cs.map(c => c.id === id ? { ...c, plan } : c));
  };

  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7ff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 360 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1830', marginBottom: '1.25rem' }}>🔐 Admin access</h1>
        <input value={secret} onChange={e => setSecret(e.target.value)} type="password" placeholder="Admin secret key" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e3f5', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box', outline: 'none' }} />
        {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 8 }}>{error}</div>}
        <button onClick={load} style={{ width: '100%', padding: '10px', background: '#5b51f8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Enter</button>
      </div>
    </div>
  );

  const statCards = [
    { icon: Users, label: 'Companies', value: stats?.total_companies, color: '#5b51f8' },
    { icon: Briefcase, label: 'Job postings', value: stats?.total_jobs, color: '#0ea5e9' },
    { icon: FileText, label: 'CVs analyzed', value: stats?.total_applicants, color: '#16a34a' },
    { icon: Star, label: 'Pro users', value: stats?.pro_users, color: '#d97706' },
  ];

  const planColor = { free: '#6b6895', pro: '#5b51f8', enterprise: '#16a34a' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#1a1830', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>⚡ ResumeIQ Admin</div>
        <button onClick={() => { setAuthed(false); localStorage.removeItem('riq_admin'); }} style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '2rem' }}>
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1830' }}>{value ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#6b6895' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Companies table */}
        <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e3f5' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1a1830' }}>All companies ({companies.length})</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f7ff' }}>
                  {['Company', 'Email', 'Plan', 'Jobs', 'CVs', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b6895', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid #f0f0f8' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: '#1a1830' }}>{c.company_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6895' }}>{c.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={c.plan} onChange={e => setPlan(c.id, e.target.value)}
                        style={{ padding: '3px 8px', border: '1px solid #e5e3f5', borderRadius: 6, fontSize: 11, fontWeight: 600, color: planColor[c.plan] || '#6b6895', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1830' }}>{c.jobs}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#1a1830' }}>{c.applicants}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b6895' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => deleteCo(c.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
