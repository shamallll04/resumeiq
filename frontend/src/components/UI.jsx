import { Loader2 } from 'lucide-react';

export function Btn({ children, variant = 'secondary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-[var(--accent)] text-white border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]',
    secondary: 'bg-white text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]',
    danger: 'bg-white text-[var(--danger)] border-[var(--border)] hover:bg-[var(--danger-bg)] hover:border-[var(--danger)]',
    ghost: 'bg-transparent text-[var(--text2)] border-transparent hover:bg-[var(--surface2)] hover:text-[var(--text)]',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500, borderRadius: 'var(--radius)', border: '1px solid', transition: 'all .15s', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, padding: size === 'sm' ? '5px 10px' : size === 'lg' ? '10px 20px' : '8px 16px', fontSize: size === 'sm' ? '12px' : '13px', fontFamily: 'inherit', ...variants[variant] === variants.primary ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {} }} {...props}>
      {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <input style={{ padding: '9px 12px', border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: 'var(--surface1)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color .15s' }} onFocus={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--accent)'} onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'} {...props} />
      {error && <span style={{ fontSize: 11, color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>}
      <select style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface1)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} {...props}>{children}</select>
    </div>
  );
}

export function Card({ children, style, ...props }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow)', ...style }} {...props}>{children}</div>;
}

export function Badge({ type }) {
  const map = {
    Required: { bg: 'var(--danger-bg)', color: '#b91c1c' },
    Preferred: { bg: 'var(--warn-bg)', color: '#92400e' },
    Bonus: { bg: 'var(--success-bg)', color: '#166534' },
    strong: { bg: 'var(--success-bg)', color: 'var(--success)' },
    partial: { bg: 'var(--warn-bg)', color: 'var(--warn)' },
    weak: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    shortlisted: { bg: '#eff6ff', color: '#1d4ed8' },
    rejected: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    reviewed: { bg: 'var(--accent-light)', color: 'var(--accent-text)' },
    pending: { bg: 'var(--surface2)', color: 'var(--text2)' },
  };
  const s = map[type] || map.pending;
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{type}</span>;
}

export function ScoreBar({ score }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 32, textAlign: 'right' }}>{score}%</span>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function Empty({ icon, text, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text2)', marginBottom: 4 }}>{text}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}
