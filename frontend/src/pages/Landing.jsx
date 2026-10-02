import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Zap, Users, BarChart3, Globe, ArrowRight, Star } from 'lucide-react';

export default function Landing() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#1a1830', background: '#fff' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#5b51f8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>ResumeIQ</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/login" style={{ padding: '8px 16px', border: '1px solid #e5e3f5', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#1a1830', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/register" style={{ padding: '8px 16px', background: '#5b51f8', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none' }}>Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '5rem 2rem 4rem', maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eeedfe', color: '#5b51f8', padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: '1.5rem' }}>
          <Zap size={12} /> AI-powered · Free to start
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: '1.25rem' }}>
          Screen CVs 10x faster<br />with AI
        </h1>
        <p style={{ fontSize: 16, color: '#6b6895', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 520, margin: '0 auto 2rem' }}>
          Define your hiring criteria, upload candidate CVs, and let AI instantly score and rank every applicant. No more reading stacks of resumes manually.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', background: '#5b51f8', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Start screening for free <ArrowRight size={16} />
          </Link>
          <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', border: '1px solid #e5e3f5', color: '#1a1830', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            <Globe size={14} /> Browse open jobs
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: '#f8f7ff', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '2.5rem' }}>Everything you need to hire smarter</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { icon: CheckCircle, color: '#16a34a', title: 'Custom criteria', desc: 'Define exactly what you\'re looking for — required, preferred, and bonus skills for each role.' },
              { icon: Zap, color: '#5b51f8', title: 'Instant AI scoring', desc: 'Every CV is scored 0–100% against your criteria in seconds using advanced AI.' },
              { icon: Users, color: '#0ea5e9', title: 'Multi-company', desc: 'Each company gets their own workspace with isolated data and job postings.' },
              { icon: Globe, color: '#d97706', title: 'Public job board', desc: 'Candidates can discover and apply to your open roles directly online.' },
              { icon: BarChart3, color: '#dc2626', title: 'Hiring dashboard', desc: 'Track all applicants, scores, and pipeline status from one place.' },
              { icon: Star, color: '#7c3aed', title: 'Shortlist in 1 click', desc: 'Mark candidates as shortlisted, reviewed, or rejected with instant email drafts.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e5e3f5', borderRadius: 14, padding: '1.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#6b6895', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Simple pricing</h2>
          <p style={{ textAlign: 'center', color: '#6b6895', fontSize: 14, marginBottom: '2.5rem' }}>Start free. Upgrade when you need more.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { name: 'Free', price: '₹0', period: 'forever', features: ['3 job postings', '50 CVs/month', 'AI scoring', 'Basic dashboard'], accent: false },
              { name: 'Pro', price: '₹999', period: '/month', features: ['Unlimited job postings', '500 CVs/month', 'Public job board', 'Priority support', 'Export reports'], accent: true },
              { name: 'Enterprise', price: '₹2,999', period: '/month', features: ['Unlimited everything', 'Custom criteria templates', 'API access', 'Dedicated support', 'White label'], accent: false },
            ].map(plan => (
              <div key={plan.name} style={{ border: `2px solid ${plan.accent ? '#5b51f8' : '#e5e3f5'}`, borderRadius: 16, padding: '1.5rem', background: plan.accent ? '#f8f7ff' : '#fff', position: 'relative' }}>
                {plan.accent && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#5b51f8', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{plan.price}<span style={{ fontSize: 13, fontWeight: 400, color: '#6b6895' }}>{plan.period}</span></div>
                <div style={{ margin: '1rem 0', borderTop: '1px solid #e5e3f5', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1a1830' }}>
                      <CheckCircle size={14} color="#16a34a" /> {f}
                    </div>
                  ))}
                </div>
                <Link to="/register" style={{ display: 'block', textAlign: 'center', padding: '9px', background: plan.accent ? '#5b51f8' : 'transparent', color: plan.accent ? '#fff' : '#5b51f8', border: `1px solid ${plan.accent ? '#5b51f8' : '#5b51f8'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#5b51f8', padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Ready to hire smarter?</h2>
        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: 14, marginBottom: '1.5rem' }}>Join companies already screening CVs with AI.</p>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 28px', background: '#fff', color: '#5b51f8', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          Create free account <ArrowRight size={16} />
        </Link>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: 12, color: '#a09dc0', borderTop: '1px solid #f0f0f0' }}>
        © 2026 ResumeIQ · AI-powered hiring platform
      </div>
    </div>
  );
}
