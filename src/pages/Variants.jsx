import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowLeft, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Code Snippet Builders ───────────────────────────────────────────────────

function buildHtmlScript(customerId, apiUrl) {
  return `<!-- Paste inside <head>, before </head> -->
<script>
(function () {
  // Hide personalised slots instantly — prevents flash of default content
  var s = document.createElement('style');
  s.innerHTML = '#dyn_headline,#dyn_subheadline,#dyn_cta{opacity:0;transition:opacity 0.25s ease}';
  document.head.appendChild(s);

  function reveal() {
    ['dyn_headline', 'dyn_subheadline', 'dyn_cta'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.opacity = '1';
    });
  }

  var p = new URLSearchParams(window.location.search);
  fetch('${apiUrl}/api/variants/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: '${customerId}',
      utm_campaign: p.get('utm_campaign'),
      utm_source:   p.get('utm_source'),
      utm_medium:   p.get('utm_medium'),
      referrer:     document.referrer,
    }),
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.slots) {
        if (data.slots.headline)    document.getElementById('dyn_headline').textContent    = data.slots.headline;
        if (data.slots.subheadline) document.getElementById('dyn_subheadline').textContent = data.slots.subheadline;
        if (data.slots.cta_text)    document.getElementById('dyn_cta').textContent         = data.slots.cta_text;
      }
      reveal();
    })
    .catch(reveal);
})();
</script>`.trim();
}

function buildReactHook(customerId, apiUrl) {
  return `// 1. Create this file: src/hooks/usePersonalization.js

import { useState, useEffect } from 'react';

export function usePersonalization() {
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    fetch('${apiUrl}/api/variants/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: '${customerId}',
        utm_campaign: p.get('utm_campaign'),
        utm_source:   p.get('utm_source'),
        utm_medium:   p.get('utm_medium'),
        referrer:     document.referrer,
      }),
    })
      .then((r) => r.json())
      .then((data) => { setSlots(data.slots || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { slots, loading };
}`.trim();
}

function buildReactUsage() {
  return `// 2. Use it in your hero component

import { usePersonalization } from '../hooks/usePersonalization';

export default function HeroSection() {
  const { slots, loading } = usePersonalization();

  // While fetching, keep your default content visible
  if (loading) return <DefaultHero />;

  return (
    <section className="hero">
      <h1>{slots?.headline    ?? 'Your Default Headline'}</h1>
      <p> {slots?.subheadline ?? 'Your default subheadline.'}</p>
      <button>{slots?.cta_text ?? 'Get Started'}</button>
    </section>
  );
}`.trim();
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.4rem 0.75rem', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600,
      border: '1px solid', borderColor: copied ? '#bbf7d0' : '#334155',
      background: copied ? '#f0fdf4' : 'transparent',
      color: copied ? '#16a34a' : '#94a3b8', cursor: 'pointer', transition: 'all 0.15s',
    }}>
      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> {label}</>}
    </button>
  );
}

// ─── Segment Variant Card ────────────────────────────────────────────────────

function VariantCard({ variant }) {
  return (
    <div style={{
      backgroundColor: '#fff', border: '1px solid var(--border-color)',
      borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem',
    }}>
      {/* Card header */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {variant.segment_name}
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {variant.persona && (
              <span style={{ padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#ede9fe', color: '#6d28d9' }}>
                {variant.persona}
              </span>
            )}
            {variant.firmographics && (
              <span style={{ padding: '0.15rem 0.55rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                {variant.firmographics}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {new Date(variant.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Trigger signal */}
      {variant.signals && (
        <div style={{ padding: '0.6rem 1.5rem', backgroundColor: '#fafafa', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', flexShrink: 0 }}>Triggers when</span>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{variant.signals}</span>
        </div>
      )}

      {/* ── Live Preview ── */}
      <div style={{ padding: '2rem 1.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '1rem' }}>
          Preview — what this segment sees
        </div>
        <div style={{ maxWidth: '560px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1.25, marginBottom: '0.6rem' }}>
            {variant.slots?.headline || <span style={{ color: '#cbd5e1', fontStyle: 'italic', fontWeight: 400 }}>Headline not generated</span>}
          </h2>
          <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.1rem' }}>
            {variant.slots?.subheadline || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Subheadline not generated</span>}
          </p>
          <button style={{
            padding: '0.65rem 1.5rem', borderRadius: '8px',
            backgroundColor: 'var(--primary-color)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: 'default',
          }}>
            {variant.slots?.cta_text || 'CTA not generated'}
          </button>
        </div>
      </div>

      {/* ── Copy values ── */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          { label: 'HEADLINE', value: variant.slots?.headline, accent: '#7c3aed' },
          { label: 'SUBHEADLINE', value: variant.slots?.subheadline, accent: '#0891b2' },
          { label: 'CTA BUTTON', value: variant.slots?.cta_text, accent: '#059669' },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.08em', color: accent, minWidth: '88px', paddingTop: '0.2rem' }}>
              {label}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5, flex: 1 }}>
              {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not generated</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Integration Panel ───────────────────────────────────────────────────────

function IntegrationPanel({ customerId, apiUrl }) {
  const [tab, setTab] = useState('react'); // 'html' | 'react'
  const htmlCode = buildHtmlScript(customerId, apiUrl);
  const reactHook = buildReactHook(customerId, apiUrl);
  const reactUsage = buildReactUsage();

  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
        fontSize: '0.85rem', fontWeight: 600,
        color: tab === id ? '#a78bfa' : '#64748b',
        borderBottom: tab === id ? '2px solid #a78bfa' : '2px solid transparent',
        transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  const codeBlock = (code) => (
    <div style={{ position: 'relative' }}>
      <pre style={{
        fontSize: '0.75rem', lineHeight: 1.75, color: '#a5f3fc',
        backgroundColor: '#020617', borderRadius: '8px',
        padding: '1.25rem', margin: 0, overflowX: 'auto',
        whiteSpace: 'pre', tabSize: 2,
      }}>
        {code}
      </pre>
      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
        <CopyButton text={code} />
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '2rem', backgroundColor: '#0f172a', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 1.75rem 0' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
          Add to Your Website
        </h3>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
          Visitors are matched to the right segment in under 100ms. Your defaults always show if signals don't match.
        </p>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
          {tabBtn('react', 'React / Next.js')}
          {tabBtn('html', 'HTML / Any Platform')}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '1.5rem 1.75rem' }}>
        {tab === 'react' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Step 1 — Create the hook
              </p>
              {codeBlock(reactHook)}
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Step 2 — Use it in your hero component
              </p>
              {codeBlock(reactUsage)}
            </div>
            <div style={{ padding: '0.875rem 1rem', backgroundColor: '#1e293b', borderRadius: '8px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <span style={{ color: '#a78bfa', fontWeight: 700 }}>How it works: </span>
              On mount, the hook fetches your visitor's matched variant. While loading, your default content renders — no layout shift, no blank flash. UTM params and referrer are read automatically.
            </div>
          </div>
        )}

        {tab === 'html' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {codeBlock(htmlCode)}
            <div style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Add these IDs to your HTML elements
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  ['id="dyn_headline"', 'Your hero <h1> or main headline'],
                  ['id="dyn_subheadline"', 'Your subheadline or hero paragraph'],
                  ['id="dyn_cta"', 'Your primary CTA button'],
                ].map(([id, desc]) => (
                  <div key={id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                    <code style={{ fontSize: '0.75rem', color: '#a78bfa', flexShrink: 0 }}>{id}</code>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Variants Page ───────────────────────────────────────────────────────────

export default function Variants() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [variants, setVariants] = useState([]);
  const [status, setStatus] = useState('loading');
  const [pollCount, setPollCount] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  const fetchVariants = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/variants`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (!res.ok) throw new Error();
      const { variants: v } = await res.json();
      if (v?.length) { setVariants(v); setStatus('ready'); }
      else setStatus('generating');
    } catch {
      setStatus('error');
    }
  }, [user?.token]);

  useEffect(() => { fetchVariants(); }, [fetchVariants]);

  useEffect(() => {
    if (status !== 'generating') return;
    const t = setTimeout(() => { setPollCount((c) => c + 1); fetchVariants(); }, 3000);
    return () => clearTimeout(t);
  }, [status, pollCount, fetchVariants]);

  const handleRegenerate = async () => {
    if (!user?.agentProfile) return;
    setRegenerating(true);
    setStatus('generating');
    setVariants([]);
    fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
      body: JSON.stringify({ profile: user.agentProfile }),
    }).catch(() => {}).finally(() => setRegenerating(false));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRegenerate}
            disabled={regenerating || status === 'generating'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.875rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-muted)', cursor: (regenerating || status === 'generating') ? 'not-allowed' : 'pointer', opacity: (regenerating || status === 'generating') ? 0.5 : 1 }}
          >
            <RefreshCw size={14} style={{ animation: (regenerating || status === 'generating') ? 'spin 1s linear infinite' : 'none' }} />
            Regenerate
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Personalisation Variants
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Every segment gets its own headline, subheadline, and CTA. Visitors are matched and served the right copy in under 100ms — no Claude calls at runtime.
          </p>
        </header>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', display: 'block', margin: '0 auto 0.75rem' }} />
            Loading variants…
          </div>
        )}

        {status === 'generating' && (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e0e7ff', borderRadius: '14px', padding: '3rem', textAlign: 'center' }}>
            <Loader2 size={36} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Worker Agent is writing your copy…
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
              Generating headline, subheadline, and CTA for each segment. Usually takes 15–30 seconds.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
              {['Headline', 'Subheadline', 'CTA'].map((s, i) => (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--primary-color)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1.5rem', color: '#be123c', fontSize: '0.9rem' }}>
            Could not load variants. Make sure the backend is running and try refreshing.
          </div>
        )}

        {status === 'ready' && variants.length > 0 && (
          <>
            {/* Summary strip */}
            <div style={{ display: 'flex', gap: '2rem', padding: '1rem 1.25rem', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1 }}>{variants.length}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Segments</div>
              </div>
              <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#059669', lineHeight: 1 }}>{variants.length * 3}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Variants Ready</div>
              </div>
              <div style={{ width: 1, backgroundColor: 'var(--border-color)' }} />
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0891b2', lineHeight: 1 }}>{'<100ms'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personalisation Latency</div>
              </div>
            </div>

            {/* One card per segment */}
            {variants.map((v) => <VariantCard key={v.segment_id} variant={v} />)}

            {/* Integration section */}
            <IntegrationPanel customerId={user?._id} apiUrl={API_URL} />
          </>
        )}
      </main>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce{ 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
      `}</style>
    </div>
  );
}
