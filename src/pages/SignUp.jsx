import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error signing up');
      }

      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Left Branding Panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)', padding: '3rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>
            <Zap size={28} color="#ffffff" fill="#ffffff" /> MarTech
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '440px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem' }}>
            Transform how you orchestrate your marketing toolkit.
          </h2>
          <p style={{ color: '#e0e7ff', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Join thousands of growth leaders operating their entire MarTech stack from a single unified control center.
          </p>
        </div>

        {/* Abstract background decorative element */}
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)', top: '-20%', left: '-20%', zIndex: 1 }} />
      </div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeIn 0.6s ease-out forwards' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create an account</h1>
            <p style={{ color: 'var(--text-muted)' }}>Enter your details to get started.</p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.875rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
            />
            <Input
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a strong password"
            />
            <Button type="submit" variant="primary" size="lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Already a member? <Link to="/signin" style={{ color: 'var(--text-main)', fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
