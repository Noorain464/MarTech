import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LayoutDashboard, Users, Zap, Briefcase, LogOut, Settings, Target } from 'lucide-react';

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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Modern Top Navigation */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Workspace</span>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Minimal Avatar */}
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
              {getInitials(user?.email)}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleLogout} style={{ display: 'flex', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
              <LogOut size={16} /> <span style={{display: 'none', '@media (min-width: 640px)': {display: 'inline'}}}>Sign out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <main style={{ flex: 1, padding: '3rem 2.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Welcome to Command.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '600px' }}>
            We've customized your tooling environment based on your onboarding profile. Here is your current setup.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
          
          {/* Profile Card Summary */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#f5f5f5', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                <Briefcase size={22} color="var(--text-main)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Your Identity</h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Onboarding Parameters</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Role</span>
                <span style={{ fontWeight: '500', backgroundColor: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>{user?.onboardingData?.role || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Core Business</span>
                <span style={{ fontWeight: '500', backgroundColor: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>{user?.onboardingData?.businessType || 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Team Size</span>
                <span style={{ fontWeight: '500', backgroundColor: '#f5f5f5', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.875rem' }}>{user?.onboardingData?.teamSize || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Goals Card Summary */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '2rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#f5f5f5', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                <Target size={22} color="var(--text-main)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '600', letterSpacing: '-0.02em' }}>Active Goals</h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Strategic priorities</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {user?.onboardingData?.primaryGoal?.map((goal, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#fafafa' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{goal}</span>
                  </div>
               ))}
               {(!user?.onboardingData?.primaryGoal || user?.onboardingData?.primaryGoal.length === 0) && (
                 <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                   No primary goals specified.
                 </div>
               )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
