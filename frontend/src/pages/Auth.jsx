import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input, Card } from '../components/UI';
import { FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AuthPage({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === 'login';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', company_name: '' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.email, form.password, form.company_name);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface1)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--accent)', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <FileText size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>ResumeIQ</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>AI-powered candidate screening</p>
        </div>

        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: '1.25rem' }}>
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!isLogin && (
              <Input label="Company name" placeholder="Acme Corp" value={form.company_name} onChange={set('company_name')} required />
            )}
            <Input label="Email address" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder={isLogin ? 'Your password' : 'Min. 6 characters'} value={form.password} onChange={set('password')} required minLength={6} />

            <button type="submit" disabled={loading} style={{ marginTop: 4, padding: '10px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1, fontFamily: 'inherit' }}>
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginTop: '1rem' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/register' : '/login'} style={{ color: 'var(--accent)', fontWeight: 500 }}>
              {isLogin ? 'Register' : 'Sign in'}
            </Link>
          </p>
        </Card>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

export const LoginPage = () => <AuthPage mode="login" />;
export const RegisterPage = () => <AuthPage mode="register" />;
