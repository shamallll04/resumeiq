import { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const BASE = import.meta.env.VITE_API_URL || '/api';

const plans = [
  {
    key: 'free', name: 'Free', price: '₹0', period: 'forever',
    features: ['3 job postings', '50 CVs/month', 'AI scoring', 'Basic dashboard'],
    accent: false,
  },
  {
    key: 'pro', name: 'Pro', price: '₹999', period: '/month',
    features: ['Unlimited job postings', '500 CVs/month', 'Public job board', 'Priority support', 'Export reports'],
    accent: true,
  },
  {
    key: 'enterprise', name: 'Enterprise', price: '₹2,999', period: '/month',
    features: ['Unlimited everything', 'Custom criteria templates', 'API access', 'Dedicated support', 'White label'],
    accent: false,
  },
];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const el = document.createElement('script');
    el.src = 'https://checkout.razorpay.com/v1/checkout.js';
    el.onload = resolve;
    el.onerror = () => reject(new Error('Could not load the payment window'));
    document.body.appendChild(el);
  });
}

function UsageBar({ label, used, limit }) {
  const unlimited = limit === null;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#5b51f8';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b6895', marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: '#1a1830' }}>{used} / {unlimited ? 'Unlimited' : limit}</span>
      </div>
      <div style={{ height: 6, background: '#f1f0fe', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: unlimited ? '8%' : `${pct}%`, background: unlimited ? '#16a34a' : color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');

  const [usage, setUsage] = useState(null);
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('riq_token')}`,
  });

  useEffect(() => {
    fetch(`${BASE}/usage`, { headers: authHeaders() })
      .then(r => r.json()).then(d => { if (!d.error) setUsage(d); }).catch(() => {});
  }, []);

  const upgrade = async (plan) => {
    if (plan === 'free') return;
    setLoading(plan);
    try {
      const res = await fetch(`${BASE}/payments/create-order`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ plan }) });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || 'Could not start payment');
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'ResumeIQ',
        description: `${plan} plan, 30 days`,
        prefill: { email: user?.email },
        handler: async (resp) => {
          try {
            // resp holds razorpay_order_id / razorpay_payment_id / razorpay_signature
            const v = await fetch(`${BASE}/payments/verify`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(resp) });
            const data = await v.json();
            if (!v.ok) throw new Error(data.error || 'Verification failed');
            toast.success(`You're on the ${plan} plan now`);
            setTimeout(() => window.location.reload(), 800);
          } catch (err) { toast.error(err.message); }
          finally { setLoading(''); }
        },
        modal: { ondismiss: () => setLoading('') },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message);
      setLoading('');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b6895', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1a1830', letterSpacing: '-0.5px', marginBottom: 8 }}>Upgrade your plan</h1>
        <p style={{ fontSize: 13, color: '#6b6895' }}>
          Current plan: <strong style={{ color: '#5b51f8', textTransform: 'capitalize' }}>{user?.plan || 'free'}</strong>
        </p>
      </div>

      {usage && (
        <div style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            <UsageBar label="Job postings" used={usage.jobs.used} limit={usage.jobs.limit} />
            <UsageBar label="CVs analyzed this month" used={usage.cvs.used} limit={usage.cvs.limit} />
          </div>
          {usage.expires && (
            <div style={{ fontSize: 12, color: '#6b6895', marginTop: 12 }}>
              Your plan is active until <strong>{new Date(usage.expires).toLocaleDateString()}</strong>. After that it returns to Free.
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {plans.map(plan => (
          <div key={plan.key} style={{ border: `2px solid ${plan.accent ? '#5b51f8' : '#e5e3f5'}`, borderRadius: 16, padding: '1.5rem', background: plan.accent ? '#f8f7ff' : '#fff', position: 'relative' }}>
            {plan.accent && (
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#5b51f8', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>
                MOST POPULAR
              </div>
            )}
            {user?.plan === plan.key && (
              <div style={{ position: 'absolute', top: 12, right: 12, background: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                CURRENT
              </div>
            )}
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#1a1830' }}>{plan.name}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: '#1a1830' }}>
              {plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#6b6895' }}>{plan.period}</span>
            </div>
            <div style={{ margin: '1rem 0', borderTop: '1px solid #e5e3f5', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1a1830' }}>
                  <CheckCircle size={14} color="#16a34a" />{f}
                </div>
              ))}
            </div>
            <button
              onClick={() => upgrade(plan.key)}
              disabled={loading === plan.key || plan.key === 'free'}
              style={{ width: '100%', padding: '10px', background: plan.accent ? '#5b51f8' : 'transparent', color: plan.accent ? '#fff' : '#5b51f8', border: `1px solid ${plan.accent ? '#5b51f8' : '#5b51f8'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: plan.key === 'free' ? 'default' : 'pointer', fontFamily: 'inherit', opacity: plan.key === 'free' ? 0.5 : 1 }}>
              {plan.key === 'free' ? (user?.plan === 'free' ? 'Current plan' : 'Free forever') : loading === plan.key ? 'Processing…' : user?.plan === plan.key ? 'Renew for 30 days' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#a09dc0', marginTop: '2rem' }}>
        Payments powered by Razorpay · Each payment adds 30 days, no auto-renewal
      </p>
    </div>
  );
}
