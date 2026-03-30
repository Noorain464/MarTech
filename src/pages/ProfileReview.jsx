import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, CheckCircle, Loader2, Trash2, Plus, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Editable Profile Cards ─────────────────────────────────────────────────

function ProfileCards({ profile, onChange }) {
  const updateIcp = (val) => onChange({ ...profile, icp: val });

  const updateProp = (i, val) => {
    const next = [...profile.value_props];
    next[i] = val;
    onChange({ ...profile, value_props: next });
  };

  const addProp = () => onChange({ ...profile, value_props: [...profile.value_props, ''] });
  const removeProp = (i) => onChange({ ...profile, value_props: profile.value_props.filter((_, idx) => idx !== i) });

  const updateSegment = (i, field, val) => {
    const next = profile.segments.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange({ ...profile, segments: next });
  };

  const addSegment = () => onChange({
    ...profile,
    segments: [...profile.segments, { name: '', description: '', firmographics: '', persona: '', pain_point: '', trigger: '', signals: '', value_prop: '' }],
  });
  const removeSegment = (i) => onChange({ ...profile, segments: profile.segments.filter((_, idx) => idx !== i) });

  const card = {
    backgroundColor: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
  };

  const label = {
    fontSize: '0.72rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
    display: 'block',
  };

  const inputBase = {
    width: '100%',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    color: 'var(--text-main)',
    backgroundColor: '#fafafa',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  };

  const fieldGroup = { marginBottom: '0.85rem' };

  return (
    <div>
      {/* ICP */}
      <div style={card}>
        <span style={label}>Ideal Customer Profile</span>
        <textarea rows={3} style={inputBase} value={profile.icp} onChange={(e) => updateIcp(e.target.value)} />
      </div>

      {/* Value Props */}
      <div style={card}>
        <span style={label}>Value Propositions</span>
        {profile.value_props.map((prop, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--primary-color)', fontWeight: 700, minWidth: '1rem' }}>·</span>
            <input
              style={{ ...inputBase, flex: 1, resize: 'none' }}
              value={prop}
              onChange={(e) => updateProp(i, e.target.value)}
              placeholder={`Value prop ${i + 1}`}
            />
            <button onClick={() => removeProp(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '0.25rem' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button onClick={addProp} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem' }}>
          <Plus size={14} /> Add value prop
        </button>
      </div>

      {/* Segments */}
      {profile.segments.map((seg, i) => (
        <div key={i} style={{ ...card, position: 'relative' }}>
          <button
            onClick={() => removeSegment(i)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}
          >
            <Trash2 size={14} />
          </button>
          <span style={{ ...label, color: 'var(--primary-color)', fontSize: '0.8rem' }}>Segment {i + 1}</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={fieldGroup}>
              <span style={label}>Name</span>
              <input style={{ ...inputBase, resize: 'none' }} value={seg.name} onChange={(e) => updateSegment(i, 'name', e.target.value)} placeholder="e.g. Enterprise Buyer" />
            </div>
            <div style={fieldGroup}>
              <span style={label}>Persona / Role</span>
              <input style={{ ...inputBase, resize: 'none' }} value={seg.persona || ''} onChange={(e) => updateSegment(i, 'persona', e.target.value)} placeholder="e.g. VP of Engineering" />
            </div>
          </div>

          <div style={fieldGroup}>
            <span style={label}>Firmographics</span>
            <input style={{ ...inputBase, resize: 'none' }} value={seg.firmographics || ''} onChange={(e) => updateSegment(i, 'firmographics', e.target.value)} placeholder="e.g. company_size > 500, industry = SaaS" />
          </div>

          <div style={fieldGroup}>
            <span style={label}>Pain Point</span>
            <textarea rows={2} style={inputBase} value={seg.pain_point || ''} onChange={(e) => updateSegment(i, 'pain_point', e.target.value)} placeholder="The specific problem this segment is solving" />
          </div>

          <div style={fieldGroup}>
            <span style={label}>Purchase Trigger</span>
            <input style={{ ...inputBase, resize: 'none' }} value={seg.trigger || ''} onChange={(e) => updateSegment(i, 'trigger', e.target.value)} placeholder="What event starts their search?" />
          </div>

          <div style={fieldGroup}>
            <span style={label}>Website Signals</span>
            <textarea rows={2} style={inputBase} value={seg.signals || ''} onChange={(e) => updateSegment(i, 'signals', e.target.value)} placeholder="e.g. visited /enterprise, UTM = enterprise-q1, referrer = LinkedIn" />
          </div>

          <div style={fieldGroup}>
            <span style={label}>Value Prop / Headline</span>
            <textarea rows={2} style={inputBase} value={seg.value_prop || ''} onChange={(e) => updateSegment(i, 'value_prop', e.target.value)} placeholder="The message or CTA tailored for this segment" />
          </div>
        </div>
      ))}

      <button
        onClick={addSegment}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px dashed var(--border-color)', borderRadius: '10px', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, padding: '0.75rem 1rem', width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
      >
        <Plus size={14} /> Add segment
      </button>
    </div>
  );
}

// ─── Profile Review Page ─────────────────────────────────────────────────────

export default function ProfileReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateExtendedProfile } = useAuth();

  const [profile, setProfile] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Track whether we just saved (vs. arriving as a returning user)
  const justSaved = useRef(false);

  useEffect(() => {
    if (location.state?.profile) {
      setProfile(location.state.profile);
    } else if (user?.agentProfile) {
      // Returning user viewing existing profile — load it but don't mark as saved
      setProfile(user.agentProfile);
    } else {
      navigate('/dashboard');
    }
  }, []);

  // Navigate after save — useEffect is reliable even across re-renders
  useEffect(() => {
    if (!saved || !justSaved.current) return;
    const timer = setTimeout(() => navigate('/variants'), 1500);
    return () => clearTimeout(timer);
  }, [saved, navigate]);

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError('');
    try {
      // Save profile to user document
      const saveRes = await fetch(`${API_URL}/api/agent/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ agentProfile: profile }),
      });
      if (!saveRes.ok) throw new Error('Failed to save profile');

      updateExtendedProfile(profile);
      localStorage.removeItem(`agentChat_${user?._id}`);

      // Kick off the Worker Agent — fire and forget (user doesn't wait)
      fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ profile }),
      }).catch((err) => console.error('Variant generation failed:', err));

      justSaved.current = true;
      setSaved(true);
    } catch {
      setSaveError('Could not save your profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Dashboard
        </button>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Your Audience Profile
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Review and edit the segments below. Once approved, your website will use these to personalize content for each visitor.
          </p>
        </header>

        <ProfileCards profile={profile} onChange={setProfile} />

        {saveError && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saveLoading || saved}
          style={{
            width: '100%', padding: '1rem',
            backgroundColor: saved ? '#10b981' : 'var(--primary-color)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontWeight: 700, fontSize: '1rem',
            cursor: saveLoading || saved ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background-color 0.2s',
          }}
        >
          {saved ? (
            <><CheckCircle size={20} /> Profile saved — redirecting…</>
          ) : saveLoading ? (
            <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
          ) : (
            'Approve & Save Profile'
          )}
        </button>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
