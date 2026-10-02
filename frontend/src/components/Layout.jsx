import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Briefcase, Settings, LogOut, FileText, Globe, Star } from 'lucide-react';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-jobs', icon: Briefcase, label: 'Job Postings' },
  { to: '/jobs', icon: Globe, label: 'Public Board' },
  { to: '/pricing', icon: Star, label: 'Upgrade' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>ResumeIQ</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
                {user?.company_name}
                <span style={{ background: user?.plan === 'pro' ? '#eeedfe' : '#f0fdf4', color: user?.plan === 'pro' ? '#5b51f8' : '#16a34a', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase' }}>
                  {user?.plan || 'free'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem 0.5rem' }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
              borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              textDecoration: 'none', transition: 'all .12s',
            })}>
              <Icon size={16} />{label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--surface1)', marginBottom: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{user?.company_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{user?.email}</div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'none', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
