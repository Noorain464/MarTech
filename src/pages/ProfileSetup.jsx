import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Building, Target, Users, Zap } from 'lucide-react';

const MULTI_SELECT_CHANNELS = ["Google Ads", "Meta Ads", "LinkedIn Ads", "SEO / organic", "Email", "Content / blog", "Influencer", "Affiliate"];
const MULTI_SELECT_OUTCOMES = [
  "Reduce content production cost", "Scale SEO / organic traffic", "Improve ad ROI",
  "Personalise website experience", "Prepare for AI search (AEO)",
  "Faster campaign iteration", "Reduce agency dependency"
];
const ProfileSetup = () => {
  const { user, updateExtendedProfile, skipExtendedProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyWebsite: '',
    industry: '',
    companySize: '',
    channels: [],
    cms: '',
    analyticsTool: '',
    crm: '',
    websiteTraffic: '',
    outcomes: [],
    painPoint: '',
    targetCustomer: '',
    targetCompanySize: '',
    buyerPersonas: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field, item, maxSelections = null) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      }
      if (maxSelections && current.length >= maxSelections) return prev;
      return { ...prev, [field]: [...current, item] };
    });
  };

  const isSelected = (field, item) => formData[field].includes(item);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      await updateExtendedProfile(formData);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    skipExtendedProfile();
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{ width: '100%', maxWidth: '800px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '700', fontSize: '1.25rem' }}>
        <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech Setup
      </div>

      <Card style={{ maxWidth: '800px', width: '100%', padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Complete your profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Help us customize your workspace by providing more details about your operations.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>

          {/* Section 1: Company */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <Building size={20} color="var(--primary-color)" /> Your company
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Input
                label="Company website"
                placeholder="https://yourco.com"
                value={formData.companyWebsite}
                onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
              />
              <div className="input-group">
                <label className="input-label">Industry</label>
                <select className="input-field" value={formData.industry} onChange={(e) => handleInputChange('industry', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Fintech">Fintech</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Agency">Agency</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Company size</label>
                <select className="input-field" value={formData.companySize} onChange={(e) => handleInputChange('companySize', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>
          </section>

          <hr style={{ borderTop: '1px solid var(--border-color)', marginBottom: '3rem' }} />

          {/* Section 4: ICP */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <Users size={20} color="var(--primary-color)" /> Your ICP (who are you selling to?)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Target customer type</label>
                <select className="input-field" value={formData.targetCustomer} onChange={(e) => handleInputChange('targetCustomer', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Target company size</label>
                <select className="input-field" value={formData.targetCompanySize} onChange={(e) => handleInputChange('targetCompanySize', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="SMB">SMB</option>
                  <option value="Mid-market">Mid-market</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <Input
                label="Primary buyer persona titles (comma separated)"
                placeholder="e.g. Head of Growth, Content Lead, CMO"
                value={formData.buyerPersonas}
                onChange={(e) => handleInputChange('buyerPersonas', e.target.value)}
              />
            </div>
          </section>

          <hr style={{ borderTop: '1px solid var(--border-color)', marginBottom: '3rem' }} />

          {/* Section 2: Marketing Setup */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <Target size={20} color="var(--primary-color)" /> Your marketing setup
            </h3>

            <div style={{ marginBottom: '2rem' }}>
              <label className="input-label" style={{ display: 'block', marginBottom: '0.75rem' }}>Channels you currently run (select all)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {MULTI_SELECT_CHANNELS.map(ch => (
                  <Button
                    key={ch} type="button"
                    variant={isSelected('channels', ch) ? 'pill-active' : 'pill'}
                    onClick={() => handleMultiSelect('channels', ch)}
                    style={{ margin: 0 }}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Current CMS / website platform</label>
                <select className="input-field" value={formData.cms} onChange={(e) => handleInputChange('cms', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="Webflow">Webflow</option>
                  <option value="WordPress">WordPress</option>
                  <option value="Shopify">Shopify</option>
                  <option value="Custom">Custom / Other</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Current analytics tool</label>
                <select className="input-field" value={formData.analyticsTool} onChange={(e) => handleInputChange('analyticsTool', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="GA4">Google Analytics 4</option>
                  <option value="Mixpanel">Mixpanel</option>
                  <option value="Amplitude">Amplitude</option>
                  <option value="PostHog">PostHog</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">CRM in use</label>
                <select className="input-field" value={formData.crm} onChange={(e) => handleInputChange('crm', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="HubSpot">HubSpot</option>
                  <option value="Salesforce">Salesforce</option>
                  <option value="Pipedrive">Pipedrive</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Monthly website traffic (approx.)</label>
                <select className="input-field" value={formData.websiteTraffic} onChange={(e) => handleInputChange('websiteTraffic', e.target.value)}>
                  <option value="">— select —</option>
                  <option value="<10k">&lt; 10k</option>
                  <option value="10k-50k">10k - 50k</option>
                  <option value="50k-250k">50k - 250k</option>
                  <option value="250k+">250k+</option>
                </select>
              </div>
            </div>
          </section>

          <hr style={{ borderTop: '1px solid var(--border-color)', marginBottom: '3rem' }} />

          {/* Section 3: Goals */}
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <Zap size={20} color="var(--primary-color)" /> Your goals with this platform
            </h3>

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
                <label className="input-label" style={{ margin: 0 }}>Top 3 outcomes you want from us</label>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formData.outcomes.length} / 3 selected</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {MULTI_SELECT_OUTCOMES.map(out => (
                  <Button
                    key={out} type="button"
                    variant={isSelected('outcomes', out) ? 'pill-active' : 'pill'}
                    onClick={() => handleMultiSelect('outcomes', out, 3)}
                    style={{ margin: 0 }}
                  >
                    {out}
                  </Button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">What's your biggest pain point right now?</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="e.g. We produce content too slowly, can't personalise at scale, ads take too long to iterate..."
                value={formData.painPoint}
                onChange={(e) => handleInputChange('painPoint', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </section>



          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem' }}>
            <button
              type="button"
              onClick={handleSkip}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'underline' }}
              disabled={saving}
              onMouseOver={(e) => e.target.style.color = 'var(--text-main)'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              Skip for now
            </button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile & personalise dashboard \u2197'}
            </Button>
          </div>

        </form>
      </Card>
    </div>
  );
};

export default ProfileSetup;
