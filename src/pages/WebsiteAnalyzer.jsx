import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Zap, ArrowLeft, Copy, Check, Loader2,
  Globe, MousePointer, Type, AlignLeft, Search,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Script builders ──────────────────────────────────────────────────────────

function buildHtmlScript(customerId, apiUrl, slots) {
  const selectorMap = JSON.stringify(
    slots.reduce((acc, s) => { acc[s.label] = s.selector; return acc; }, {})
  );
  return `<!-- Paste inside <head> on every page you want personalised -->
<script>
(function () {
  var API_URL     = '${apiUrl}';
  var CUSTOMER_ID = '${customerId}';
  var SELECTORS   = ${selectorMap};

  // Hide personalised elements instantly — prevents flash of default content
  var style = document.createElement('style');
  style.textContent = Object.values(SELECTORS)
    .map(function(sel) { return sel + '{opacity:0;transition:opacity 0.25s ease}'; })
    .join('');
  document.head.appendChild(style);

  function reveal() {
    Object.values(SELECTORS).forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.style.opacity = '1';
    });
  }

  var p = new URLSearchParams(window.location.search);
  fetch(API_URL + '/api/variants/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id:  CUSTOMER_ID,
      utm_campaign: p.get('utm_campaign'),
      utm_source:   p.get('utm_source'),
      utm_medium:   p.get('utm_medium'),
      referrer:     document.referrer,
    }),
  })
  .then(function (r) { return r.json(); })
  .then(function (data) {
    if (data.slots) {
      Object.keys(SELECTORS).forEach(function (label) {
        if (data.slots[label]) {
          var el = document.querySelector(SELECTORS[label]);
          if (el) el.textContent = data.slots[label];
        }
      });
    }
    reveal();
  })
  .catch(reveal);
})();
</script>`.trim();
}

function buildReactHook(customerId, apiUrl, slots) {
  const selectorMap = JSON.stringify(
    slots.reduce((acc, s) => { acc[s.label] = s.selector; return acc; }, {}),
    null, 2
  );
  return `// src/hooks/usePersonalization.js
import { useState, useEffect } from 'react';

const SELECTORS = ${selectorMap};

export function usePersonalization() {
  const [slots, setSlots] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    fetch('${apiUrl}/api/variants/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id:  '${customerId}',
        utm_campaign: p.get('utm_campaign'),
        utm_source:   p.get('utm_source'),
        utm_medium:   p.get('utm_medium'),
        referrer:     document.referrer,
      }),
    })
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || null))
      .catch(() => {});
  }, []);

  // Returns: slot values + the CSS selectors to target
  return { slots, selectors: SELECTORS };
}

// Usage in your component:
// const { slots } = usePersonalization();
// <h1>{slots?.['Hero Headline'] ?? 'Your default headline'}</h1>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid', borderColor: copied ? '#bbf7d0' : '#334155', background: copied ? '#f0fdf4' : 'transparent', color: copied ? '#16a34a' : '#94a3b8', cursor: 'pointer', transition: 'all 0.15s' }}
    >
      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> {label}</>}
    </button>
  );
}

const TYPE_META = {
  headline:    { Icon: Type,         color: '#7c3aed', bg: '#ede9fe' },
  subheadline: { Icon: Type,         color: '#0891b2', bg: '#e0f2fe' },
  cta:         { Icon: MousePointer, color: '#059669', bg: '#d1fae5' },
  paragraph:   { Icon: AlignLeft,    color: '#d97706', bg: '#fef3c7' },
  other:       { Icon: Globe,        color: '#64748b', bg: '#f1f5f9' },
};

function tagMeta(type) { return TYPE_META[type] || TYPE_META.other; }

function CodeBlock({ code }) {
  return (
    <div style={{ position: 'relative', marginTop: '0.75rem' }}>
      <pre style={{ fontSize: '0.72rem', lineHeight: 1.75, color: '#a5f3fc', backgroundColor: '#020617', borderRadius: '8px', padding: '1.25rem', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {code}
      </pre>
      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WebsiteAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // step: 'url' → 'elements' → 'integration'
  const [step, setStep]           = useState('url');
  const [url, setUrl]             = useState('');
  const [scraping, setScraping]   = useState(false);
  const [scrapeError, setScrapeError] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [elements, setElements]   = useState([]);
  const [generating, setGenerating] = useState(false);
  const [confirmedSlots, setConfirmedSlots] = useState([]);
  const [integrationTab, setIntegrationTab] = useState('html');

  const selected = elements.filter(e => e.selected);

  // ── Step 1: scrape ──
  const handleScrape = async () => {
    if (!url.trim()) return;
    setScraping(true);
    setScrapeError('');
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ url: url.trim() }),
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status}). Make sure the backend is deployed.`); }
      if (!res.ok) throw new Error(data.message || 'Failed to scrape');
      setPageTitle(data.page_title);
      setElements(data.elements);
      setStep('elements');
    } catch (err) {
      setScrapeError(err.message);
    } finally {
      setScraping(false);
    }
  };

  // ── Step 2: generate variants for selected elements ──
  const handleGenerate = async () => {
    if (!selected.length || !user?.agentProfile) return;
    setGenerating(true);
    try {
      const slotNames = selected.map(e => e.label);
      // Fire-and-forget — variants page polls for results
      fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ profile: user.agentProfile, slots: slotNames }),
      }).catch(() => {});

      setConfirmedSlots(selected.map(e => ({ label: e.label, selector: e.selector })));
      setStep('integration');
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (id) => setElements(prev => prev.map(e => e.id === id ? { ...e, selected: !e.selected } : e));
  const updateLabel = (id, label) => setElements(prev => prev.map(e => e.id === id ? { ...e, label } : e));

  const htmlScript  = step === 'integration' ? buildHtmlScript(user?._id, API_URL, confirmedSlots) : '';
  const reactScript = step === 'integration' ? buildReactHook(user?._id, API_URL, confirmedSlots) : '';

  const card = { backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.25rem' };
  const stepDone = (s) => ({ url: [], elements: ['url'], integration: ['url','elements'] }[step] || []).includes(s);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {step === 'integration' && (
            <button onClick={() => navigate('/variants')} style={{ padding: '0.4rem 0.875rem', borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              View Generated Variants →
            </button>
          )}
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>Website Analyzer</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Enter your website URL. We'll scan it, find personalizable elements, and generate a script that swaps content per visitor segment — no code changes needed on your site.
          </p>
        </header>

        {/* Step progress */}
        <div style={{ display: 'flex', marginBottom: '2.5rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[['url','1. Enter URL'],['elements','2. Pick Elements'],['integration','3. Get Script']].map(([s, label], i) => (
            <div key={s} style={{ flex: 1, padding: '0.75rem', textAlign: 'center', backgroundColor: step === s ? 'var(--primary-color)' : stepDone(s) ? '#f0fdf4' : '#fafafa', borderRight: i < 2 ? '1px solid var(--border-color)' : 'none' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === s ? '#fff' : stepDone(s) ? '#16a34a' : 'var(--text-muted)' }}>
                {stepDone(s) ? '✓ ' : ''}{label}
              </span>
            </div>
          ))}
        </div>

        {/* ══ STEP 1: URL input ══ */}
        {step === 'url' && (
          <div style={card}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Enter your website URL</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              We'll fetch the page, extract headlines, subheadlines, and CTAs, and let you pick which ones to personalise per audience segment.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Globe size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScrape()}
                  placeholder="https://yourwebsite.com"
                  style={{ width: '100%', padding: '0.75rem 0.875rem 0.75rem 2.5rem', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: 'var(--text-main)' }}
                />
              </div>
              <button
                onClick={handleScrape}
                disabled={scraping || !url.trim()}
                style={{ padding: '0.75rem 1.25rem', backgroundColor: scraping || !url.trim() ? '#e2e8f0' : 'var(--primary-color)', color: scraping || !url.trim() ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: scraping || !url.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
              >
                {scraping ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scanning…</> : <><Search size={16} /> Scan Site</>}
              </button>
            </div>

            {scrapeError && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px', fontSize: '0.875rem', color: '#be123c' }}>
                {scrapeError}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fafafa', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-main)' }}>What we scan for:</strong> H1/H2/H3 headings, hero paragraphs, CTA buttons and links. We ignore nav, footer, and decorative elements automatically.
            </div>
          </div>
        )}

        {/* ══ STEP 2: Element selection ══ */}
        {step === 'elements' && (
          <>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Check size={16} color="#16a34a" />
              <span style={{ fontSize: '0.875rem', color: '#15803d' }}>
                <strong>{elements.length} elements</strong> found on <strong>{pageTitle}</strong>
              </span>
              <button onClick={() => setStep('url')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#16a34a', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                Scan different URL
              </button>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Select elements to personalise</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Each selected element gets unique copy per audience segment. You can rename the label — that becomes the slot name in generated copy.
                  </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700, flexShrink: 0, paddingTop: '0.2rem' }}>
                  {selected.length} selected
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {elements.map(el => {
                  const { Icon, color, bg } = tagMeta(el.type);
                  return (
                    <div
                      key={el.id}
                      onClick={() => toggle(el.id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '10px', border: `1px solid ${el.selected ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: el.selected ? '#faf5ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {/* Checkbox */}
                      <div style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${el.selected ? 'var(--primary-color)' : '#cbd5e1'}`, backgroundColor: el.selected ? 'var(--primary-color)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.15rem' }}>
                        {el.selected && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>

                      {/* Tag badge */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: bg, color, flexShrink: 0, marginTop: '0.15rem' }}>
                        <Icon size={10} />{el.tag}
                      </span>

                      {/* Text + label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: '0 0 0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {el.text_preview}
                        </p>
                        <code style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{el.selector}</code>
                        {el.selected && (
                          <input
                            value={el.label}
                            onClick={e => e.stopPropagation()}
                            onChange={e => updateLabel(el.id, e.target.value)}
                            placeholder="Label this slot (e.g. Hero Headline)"
                            style={{ display: 'block', marginTop: '0.4rem', width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#475569', backgroundColor: '#fff' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selected.length || generating}
              style={{ width: '100%', padding: '1rem', backgroundColor: !selected.length || generating ? '#e2e8f0' : 'var(--primary-color)', color: !selected.length || generating ? '#94a3b8' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: !selected.length || generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {generating
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Starting generation…</>
                : `Generate copy for ${selected.length} element${selected.length !== 1 ? 's' : ''} × all segments →`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              The Worker Agent writes copy in the background. You'll get your script tag immediately.
            </p>
          </>
        )}

        {/* ══ STEP 3: Integration ══ */}
        {step === 'integration' && (
          <>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Check size={16} color="#16a34a" />
              <span style={{ fontSize: '0.875rem', color: '#15803d' }}>
                <strong>{confirmedSlots.length} elements</strong> locked in. Variants are generating in the background — usually ready in 20–40 seconds.
              </span>
            </div>

            {/* Summary of what's being personalised */}
            <div style={{ ...card, marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.875rem' }}>Elements being personalised</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {confirmedSlots.map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-color)', minWidth: '140px' }}>{s.label}</span>
                    <code style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.selector}</code>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration code panel */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem 1.75rem 0' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Add to Your Website</h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
                  Visitors are matched to their segment in under 100ms. Defaults always show if no match is found.
                </p>
                <div style={{ display: 'flex', borderBottom: '1px solid #1e293b' }}>
                  {[['html','HTML / Any Platform'],['react','React / Next.js']].map(([t, label]) => (
                    <button key={t} onClick={() => setIntegrationTab(t)} style={{ padding: '0.5rem 1rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: integrationTab === t ? '#a78bfa' : '#64748b', borderBottom: `2px solid ${integrationTab === t ? '#a78bfa' : 'transparent'}`, transition: 'all 0.15s' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '1.5rem 1.75rem' }}>
                {integrationTab === 'html' && (
                  <>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Paste once in <code style={{ color: '#a78bfa' }}>&lt;head&gt;</code>. Works on Webflow, WordPress, Squarespace, or any HTML site. No other changes needed.
                    </p>
                    <CodeBlock code={htmlScript} />
                  </>
                )}
                {integrationTab === 'react' && (
                  <>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Drop the hook into your project. Your CSS selectors are pre-filled — use <code style={{ color: '#a78bfa' }}>slots?.['Label Name']</code> to render personalised copy with a fallback.
                    </p>
                    <CodeBlock code={reactScript} />
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
