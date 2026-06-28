import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    toast.success('Settings saved');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 620, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Manage your account and preferences.</p>
      </div>

      <Card style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>Account</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Company name</label>
            <input defaultValue={user?.company_name} style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Email</label>
            <input defaultValue={user?.email} type="email" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>New password</label>
            <input type="password" placeholder="Leave blank to keep current" style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface1)', color: 'var(--text)', outline: 'none' }} />
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>AI analysis</h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: '1rem' }}>Configure how Claude evaluates CVs against your criteria.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Standard', sub: 'Evaluates all criteria with concise reasoning' },
            { label: 'Deep analysis', sub: 'More detailed reasoning and cultural fit signals' },
          ].map((opt, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '10px 12px', border: `1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: i === 0 ? 'var(--accent-light)' : 'var(--surface1)' }}>
              <input type="radio" name="depth" defaultChecked={i === 0} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: '1.25rem', background: 'var(--danger-bg)', border: '1px solid #fecaca' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Danger zone</h2>
        <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: '1rem' }}>These actions are permanent and cannot be undone.</p>
        <button style={{ padding: '8px 14px', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', background: 'none', color: 'var(--danger)', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer' }} onClick={() => toast.error('Contact support to delete your account')}>Delete account</button>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={save} style={{ padding: '9px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
