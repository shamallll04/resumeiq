import { useState } from 'react';
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

export default function Pricing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState('');

  const upgrade = async (plan) => {
    if (plan === 'free') return;
    setLoading(plan);
    try {
      const token = localStorage.getItem('riq_token');
      const res = await fetch(`${BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const order = await res.json();

      // In production: open Razorpay checkout here
      // For now simulate success
      await fetch(`${BASE}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, orderId: order.orderId }),
      });
      toast.success(`Upgraded to ${plan}! Refresh to see changes.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
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
              disabled={loading === plan.key || user?.plan === plan.key}
              style={{ width: '100%', padding: '10px', background: plan.accent ? '#5b51f8' : 'transparent', color: plan.accent ? '#fff' : '#5b51f8', border: `1px solid ${plan.accent ? '#5b51f8' : '#5b51f8'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: user?.plan === plan.key ? 'default' : 'pointer', fontFamily: 'inherit', opacity: user?.plan === plan.key ? 0.5 : 1 }}>
              {user?.plan === plan.key ? 'Current plan' : loading === plan.key ? 'Processing…' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#a09dc0', marginTop: '2rem' }}>
        Payments powered by Razorpay · Cancel anytime
      </p>
    </div>
  );
}
