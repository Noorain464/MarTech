import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

const SignIn = () => {
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
      const res = await fetch('https://martech-7l0n.onrender.com/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error signing in');
      }

      login(data);
      if (data.isOnboarded) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Left Branding Panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.5rem', letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
            <Zap size={28} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '440px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
            Welcome back to your workspace.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
            Log in to continue optimizing your workflows and driving growth.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', animation: 'fadeIn 0.6s ease-out forwards' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Sign In</h1>
            <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access your account.</p>
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
              placeholder="Enter your password"
            />
            <Button type="submit" variant="primary" size="lg" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--text-main)', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
