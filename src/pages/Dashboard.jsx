import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LayoutDashboard, Users, Zap, Briefcase, LogOut, Settings, Target, Lock } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const isLocked = !user?.isProfileComplete;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Modern Top Navigation */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Workspace</span>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
              {getInitials(user?.email)}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout} style={{ display: 'flex', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
              <LogOut size={16} /> <span style={{display: 'none', '@media (min-width: 640px)': {display: 'inline'}}}>Sign out</span>
            </Button>
          </div>
        </div>
      </nav>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Main Layout Grid */}
        <main style={{ 
          flex: 1, 
          padding: '3rem 2.5rem', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          width: '100%'
        }}>
          
          <header style={{ marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Welcome to Command.
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
               Select a service below to get started and personalise your MarTech experience.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
            
            {/* Service card */}
            <div 
              onClick={() => navigate('/profile-setup')}
              style={{ 
                backgroundColor: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '2.5rem', 
                border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
                display: 'flex', flexDirection: 'column', gap: '1.5rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div style={{ backgroundColor: '#f1f5f9', width: '3.5rem', height: '3.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={28} color="var(--primary-color)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '600', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Personalised website service</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                  Tailor your entire website experience dynamically for different user segments. Unlock powerful personalization features to drive conversions.
                </p>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.95rem' }}>
                Get Started &rarr;
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
