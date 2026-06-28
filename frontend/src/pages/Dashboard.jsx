import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Card, Badge, ScoreBar, Spinner } from '../components/UI';
import { Briefcase, Users, TrendingUp, Star, ArrowRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 1 }}>{label}</div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const s = data?.stats || {};

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>
          Welcome back{user?.company_name ? `, ${user.company_name}` : ''} 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Here's what's happening with your hiring pipeline.</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: '1.75rem' }}>
            <StatCard icon={Briefcase} label="Job postings" value={s.total_jobs} color="var(--accent)" />
            <StatCard icon={Users} label="CVs reviewed" value={s.total_applicants} color="#0ea5e9" />
            <StatCard icon={Star} label="Strong matches" value={s.strong_matches} color="var(--success)" />
            <StatCard icon={TrendingUp} label="Avg match score" value={s.avg_score ? `${Math.round(s.avg_score)}%` : null} color="var(--warn)" />
          </div>

          {/* Recent applicants */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Recent applicants</h2>
              <Link to="/jobs" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>View jobs <ArrowRight size={12} /></Link>
            </div>

            {!data?.recentApplicants?.length ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: 13 }}>
                No applicants yet. <Link to="/jobs" style={{ color: 'var(--accent)' }}>Create a job posting →</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {data.recentApplicants.map((a, i) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < data.recentApplicants.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {a.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{a.job_title}</div>
                    </div>
                    <div style={{ width: 120 }}>
                      <ScoreBar score={a.score ?? 0} />
                    </div>
                    <Badge type={a.tier} />
                    <Badge type={a.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
