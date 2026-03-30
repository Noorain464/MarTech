import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowLeft, Copy, Check, Loader2, Globe, MousePointer, Type, AlignLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Script Tag Builder ───────────────────────────────────────────────────────

function buildAnalyzerScript(customerId, apiUrl) {
  return `<script>
(function () {
  var CUSTOMER_ID = '${customerId}';
  var API_URL     = '${apiUrl}';
  var STORAGE_KEY = 'martech_confirmed_' + CUSTOMER_ID;
  var confirmed   = localStorage.getItem(STORAGE_KEY);

  if (confirmed) {
    // ── PERSONALIZATION MODE ──
    runPersonalization(JSON.parse(confirmed));
  } else {
    // ── SCAN MODE ──
    document.addEventListener('DOMContentLoaded', runScan);
  }

  function runScan() {
    var defs = [
      { sel: 'h1',                                    type: 'headline' },
      { sel: 'h2',                                    type: 'subheadline' },
      { sel: 'h3',                                    type: 'subheadline' },
      { sel: 'header p, section p, .hero p, main p',  type: 'paragraph' },
      { sel: 'button, a.btn, a.cta, [class*="cta"], [class*="btn"]', type: 'cta' },
    ];
    var elements = [], counters = {};
    defs.forEach(function (d) {
      document.querySelectorAll(d.sel).forEach(function (el) {
        if (elements.length >= 20) return;
        var text = (el.textContent || '').trim().slice(0, 120);
        if (text.length < 3) return;
        var base = 'mt_' + el.tagName.toLowerCase() + '_';
        counters[base] = (counters[base] || 0) + 1;
        var id = base + (counters[base] - 1);
        el.setAttribute('data-martech-id', id);
        elements.push({ martech_id: id, tag: el.tagName, type: d.type, text_preview: text });
      });
    });
    fetch(API_URL + '/api/analyze/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: CUSTOMER_ID,
        page_url:    window.location.href,
        page_title:  document.title,
        elements:    elements
      })
    }).catch(function () {});
    showToast(elements.length);
  }

  function showToast(count) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:#1e293b;color:#f8fafc;padding:12px 18px;border-radius:10px;font-size:13px;font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.3);border-left:3px solid #7c3aed;cursor:default';
    el.textContent = 'MarTech: ' + count + ' elements found — review in dashboard \u2192';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 7000);
  }

  function runPersonalization(slots) {
    var ids = slots.map(function (s) { return s.martech_id; });
    var style = document.createElement('style');
    style.textContent = ids.map(function (id) {
      return '[data-martech-id="' + id + '"]{opacity:0;transition:opacity 0.25s ease}';
    }).join('');
    document.head.appendChild(style);
    var reveal = function () {
      ids.forEach(function (id) {
        var el = document.querySelector('[data-martech-id="' + id + '"]');
        if (el) el.style.opacity = '1';
      });
    };
    var p = new URLSearchParams(window.location.search);
    fetch(API_URL + '/api/variants/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id:  CUSTOMER_ID,
        utm_campaign: p.get('utm_campaign'),
        utm_source:   p.get('utm_source'),
        utm_medium:   p.get('utm_medium'),
        referrer:     document.referrer
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.slots) {
        slots.forEach(function (s) {
          var el = document.querySelector('[data-martech-id="' + s.martech_id + '"]');
          if (el && data.slots[s.label]) el.textContent = data.slots[s.label];
        });
      }
      reveal();
    })
    .catch(reveal);
  }
})();
</script>`.trim();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  headline:    { icon: Type,         color: '#7c3aed', bg: '#ede9fe', label: 'Headline' },
  subheadline: { icon: Type,         color: '#0891b2', bg: '#e0f2fe', label: 'Subheadline' },
  cta:         { icon: MousePointer, color: '#059669', bg: '#d1fae5', label: 'CTA' },
  paragraph:   { icon: AlignLeft,    color: '#d97706', bg: '#fef3c7', label: 'Paragraph' },
  nav_cta:     { icon: Globe,        color: '#6366f1', bg: '#e0e7ff', label: 'Nav CTA' },
};

function typeMeta(type) {
  return TYPE_META[type] || { color: '#64748b', bg: '#f1f5f9', label: type };
}

// ─── WebsiteAnalyzer Page ─────────────────────────────────────────────────────

export default function WebsiteAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // view: 'script' → 'waiting' → 'review' → 'generating'
  const [view, setView]         = useState('script');
  const [scan, setScan]         = useState(null);
  const [elements, setElements] = useState([]);
  const [pollCount, setPollCount] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState('all');
  const pollRef = useRef(false);

  const scriptTag = buildAnalyzerScript(user?._id, API_URL);

  // ── Poll for scan results ──
  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/analyze/latest`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const data = await res.json();
      if (data.scan?.status === 'received' || data.scan?.status === 'confirmed') {
        setScan(data.scan);
        setElements(data.scan.elements.map(el => ({ ...el, selected: el.selected ?? false })));
        setView('review');
      }
    } catch { /* silent */ }
  }, [user?.token]);

  useEffect(() => {
    if (view !== 'waiting') return;
    const t = setTimeout(() => { setPollCount(c => c + 1); fetchLatest(); }, 3000);
    return () => clearTimeout(t);
  }, [view, pollCount, fetchLatest]);

  // ── Check for existing scan on load (returning user) ──
  useEffect(() => {
    if (pollRef.current) return;
    pollRef.current = true;
    fetchLatest();
  }, [fetchLatest]);

  // ── Toggle element selection ──
  const toggle = (id) =>
    setElements(prev => prev.map(el => el.martech_id === id ? { ...el, selected: !el.selected } : el));

  const updateLabel = (id, label) =>
    setElements(prev => prev.map(el => el.martech_id === id ? { ...el, label } : el));

  const selectedElements = elements.filter(e => e.selected);

  // ── Confirm + Generate ──
  const handleGenerate = async () => {
    if (!selectedElements.length || !scan) return;
    setSaving(true);
    try {
      // 1. Lock in the selections
      await fetch(`${API_URL}/api/analyze/${scan._id}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ elements }),
      });

      // 2. Write confirmed slots to localStorage so script tag switches to personalization mode
      const confirmedSlots = selectedElements.map(e => ({ martech_id: e.martech_id, label: e.label }));
      localStorage.setItem(`martech_confirmed_${user?._id}`, JSON.stringify(confirmedSlots));

      // 3. Fire Worker Agent with selected slot labels
      const slotNames = selectedElements.map(e => e.label);
      fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ profile: user?.agentProfile, slots: slotNames }),
      }).catch(() => {});

      navigate('/variants');
    } catch {
      setSaving(false);
    }
  };

  // ── Filtered elements ──
  const filtered = filter === 'all' ? elements : elements.filter(e => e.type === filter);
  const types = ['all', ...Array.from(new Set(elements.map(e => e.type)))];

  // ── Shared styles ──
  const card = { backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.75rem', marginBottom: '1.25rem' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>

      {/* Nav */}
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-color)', padding: '1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
          <Zap size={24} color="var(--primary-color)" fill="var(--primary-color)" /> MarTech
        </div>
        <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            Website Analyzer
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
            Paste one script tag on your site. We scan your page and find personalizable elements — you pick which ones get swapped for each audience segment.
          </p>
        </header>

        {/* ── Step indicators ── */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '2.5rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'script',     label: '1. Add Script' },
            { id: 'waiting',    label: '2. Scan Site' },
            { id: 'review',     label: '3. Pick Elements' },
          ].map((step, i) => {
            const isActive = step.id === view || (view === 'generating' && step.id === 'review');
            const isDone = (
              (step.id === 'script'  && ['waiting','review','generating'].includes(view)) ||
              (step.id === 'waiting' && ['review','generating'].includes(view))
            );
            return (
              <div key={step.id} style={{ flex: 1, padding: '0.75rem 1rem', backgroundColor: isActive ? 'var(--primary-color)' : isDone ? '#f0fdf4' : '#fafafa', borderRight: i < 2 ? '1px solid var(--border-color)' : 'none', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#fff' : isDone ? '#16a34a' : 'var(--text-muted)' }}>
                  {isDone ? '✓ ' : ''}{step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ══ VIEW: SCRIPT ══ */}
        {view === 'script' && (
          <div style={card}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Step 1 — Add this script to your website
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Paste it inside <code style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>&lt;head&gt;</code> on any page you want to personalise. Once pasted, visit that page — we'll detect your elements automatically.
            </p>

            {/* Dark script block */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>script tag — paste once, works forever</span>
                <CopyButton text={scriptTag} label="Copy Script" />
              </div>
              <pre style={{ fontSize: '0.72rem', lineHeight: 1.75, color: '#a5f3fc', padding: '1.25rem', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {scriptTag}
              </pre>
            </div>

            {/* How it works */}
            <div style={{ backgroundColor: '#fafafa', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text-main)' }}>How it works:</strong> The script scans your page for headlines, subheadlines, and CTAs. It sends the list to MarTech — no page content is stored, only element tags and a text preview. After you confirm which elements to personalise, the same script automatically switches to personalisation mode.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => { setView('waiting'); fetchLatest(); }}
                style={{ flex: 1, padding: '0.875rem', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                I've pasted it — scan my site →
              </button>
              {scan && (
                <button
                  onClick={() => setView('review')}
                  style={{ padding: '0.875rem 1.25rem', border: '1px solid var(--border-color)', borderRadius: '10px', background: '#fff', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  View previous scan
                </button>
              )}
            </div>
          </div>
        )}

        {/* ══ VIEW: WAITING ══ */}
        {view === 'waiting' && (
          <div style={{ ...card, textAlign: 'center', padding: '3.5rem 2rem' }}>
            <Globe size={40} color="var(--primary-color)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Waiting for your site to be scanned…
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 2rem' }}>
              Visit the page where you added the script tag. A toast notification will appear confirming the scan. Come back here — this page updates automatically.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
              <Loader2 size={18} color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Polling for scan results…</span>
            </div>
            <button
              onClick={() => setView('script')}
              style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Back to script tag
            </button>
          </div>
        )}

        {/* ══ VIEW: REVIEW ══ */}
        {view === 'review' && scan && (
          <>
            {/* Scan summary */}
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Check size={18} color="#16a34a" />
              <div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#15803d' }}>Scan received</span>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', marginLeft: '0.5rem' }}>
                  {elements.length} elements found on <strong>{scan.page_title || scan.page_url}</strong>
                </span>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Select elements to personalise
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Check each element you want swapped per audience segment. You can rename it too.
                  </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: '0.2rem' }}>
                  {selectedElements.length} selected
                </span>
              </div>

              {/* Type filter tabs */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {types.map(t => {
                  const meta = t === 'all' ? { label: 'All', color: '#475569', bg: '#f1f5f9' } : typeMeta(t);
                  const active = filter === t;
                  return (
                    <button key={t} onClick={() => setFilter(t)} style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: active ? (t === 'all' ? '#1e293b' : meta.color) : meta.bg, color: active ? '#fff' : meta.color, transition: 'all 0.15s' }}>
                      {meta.label}
                    </button>
                  );
                })}
              </div>

              {/* Element list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {filtered.map(el => {
                  const meta = typeMeta(el.type);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={el.martech_id}
                      onClick={() => toggle(el.martech_id)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem', borderRadius: '10px', border: `1px solid ${el.selected ? 'var(--primary-color)' : 'var(--border-color)'}`, backgroundColor: el.selected ? '#faf5ff' : '#fafafa', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {/* Checkbox */}
                      <div style={{ width: 18, height: 18, borderRadius: '4px', border: `2px solid ${el.selected ? 'var(--primary-color)' : '#cbd5e1'}`, backgroundColor: el.selected ? 'var(--primary-color)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                        {el.selected && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>

                      {/* Type badge */}
                      <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: meta.bg, color: meta.color }}>
                          {Icon && <Icon size={10} />}{el.tag}
                        </span>
                      </div>

                      {/* Text + label input */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', margin: '0 0 0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {el.text_preview}
                        </p>
                        {el.selected && (
                          <input
                            value={el.label}
                            onClick={e => e.stopPropagation()}
                            onChange={e => updateLabel(el.martech_id, e.target.value)}
                            placeholder="Label for this slot (e.g. Hero Headline)"
                            style={{ width: '100%', padding: '0.3rem 0.5rem', fontSize: '0.78rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', color: '#475569', backgroundColor: '#fff', outline: 'none', boxSizing: 'border-box' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedElements.length || saving}
              style={{ width: '100%', padding: '1rem', backgroundColor: (!selectedElements.length || saving) ? '#e2e8f0' : 'var(--primary-color)', color: (!selectedElements.length || saving) ? '#94a3b8' : '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: (!selectedElements.length || saving) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background-color 0.2s' }}
            >
              {saving
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Locking in selections…</>
                : `Generate variants for ${selectedElements.length || '…'} selected element${selectedElements.length !== 1 ? 's' : ''} →`
              }
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>
              The Worker Agent will write personalised copy for each segment. Your script tag automatically switches to personalisation mode — no re-paste needed.
            </p>
          </>
        )}
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
