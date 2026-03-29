import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Zap, ArrowRight, CheckCircle2, ShieldCheck, 
  Workflow, Sparkles, BarChart3, Bot, 
  Code2, Users2, XCircle, LayoutDashboard
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.05], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Code2 size={24} />,
      name: "No dev required",
      desc: "Deploy advanced personalisations visually without waiting on engineering tickets or touching a single line of code."
    },
    {
      icon: <Bot size={24} />,
      name: "No manual babysitting",
      desc: "Our AI agents continuously test and adjust copy, imagery, and CTAs 24/7 without required human intervention."
    },
    {
      icon: <Workflow size={24} />,
      name: "We optimise for both",
      desc: "Capture existing demand through high-intent AI search indexing, and generate new demand via organic discovery pipelines."
    },
    {
      icon: <Sparkles size={24} />,
      name: "Hyper-relevant segments",
      desc: "Group inbound traffic by behavioural vectors instantly, serving unique content to discrete audiences at scale."
    },
    {
      icon: <BarChart3 size={24} />,
      name: "Outcome attribution",
      desc: "Stop guessing what worked. See exact revenue uplifts attributed explicitly to AI-driven micro-adjustments."
    }
  ];

  return (
    <div className="home-wrapper">
      
      {/* Decorative Background Elements */}
      <div className="home-bg-effects">
        <div className="home-bg-blob-1" />
        <div className="home-bg-blob-2" />
      </div>

      {/* Minimalism Nav */}
      <nav className={`home-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="home-nav-container">
          <div className="home-nav-logo">
            <Zap className="home-nav-logo-icon" />
            <span>MarTech</span>
          </div>
          
          <div className="home-nav-links">
            {['Platform', 'Solutions', 'Customers', 'Pricing'].map(link => (
              <a href="#" key={link} className="home-nav-link">{link}</a>
            ))}
          </div>

          <div className="home-nav-actions">
            <button onClick={() => navigate('/signin')} className="home-btn-login">
              Log in
            </button>
            <button onClick={() => navigate('/signup')} className="home-btn-cta">
              Get started free
            </button>
          </div>
        </div>
      </nav>

      <main className="home-main">
        
        {/* HERO SECTION */}
        <section className="hero-section">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Badge */}
            <div className="hero-badge">
              <Sparkles size={14} /> AI-native marketing platform
            </div>

            {/* Headline */}
            <h1 className="hero-title">
              Your entire marketing stack, run by AI.
            </h1>

            {/* Subheadline focus on AI Search */}
            <p className="hero-subtitle">
              Don't manually guess what works. Our artificial intelligence restructures your website explicitly for <span className="hero-subtitle-highlight">next-generation AI Search indexing</span>, capturing demand your competitors can't even see.
            </p>

            {/* CTAs */}
            <div className="hero-actions">
              <button onClick={() => navigate('/signup')} className="btn-primary-lg">
                Start building for free <ArrowRight size={18} />
              </button>
              <button className="btn-secondary-lg">
                Book a demo
              </button>
            </div>

            {/* Trust Tickers */}
            <div className="trust-tickers">
              <span className="trust-item">
                <ShieldCheck size={16} style={{ color: '#10b981' }} /> No credit card required
              </span>
              <span className="trust-item">
                <Zap size={16} style={{ color: '#f59e0b' }} /> 10 minute setup
              </span>
              <span className="trust-item">
                <Workflow size={16} style={{ color: 'var(--primary-color)' }} /> Works with existing stack
              </span>
            </div>
          </motion.div>

          {/* Wireframe Mockup Preview */}
          <motion.div 
            style={{ opacity, scale }}
            className="wireframe-container"
          >
            <div className="wireframe-fade" />
            <div className="wireframe-mockup">
              {/* Fake browser bar */}
              <div className="wireframe-bar">
                <div className="wireframe-dot" />
                <div className="wireframe-dot" />
                <div className="wireframe-dot" />
              </div>
              
              <div className="wireframe-body">
                 {/* Dashboard Wireframe Abstraction */}
                 <div className="wf-header">
                    <div className="wf-title-block" style={{ animation: 'fadeIn 2s ease-in-out infinite alternate' }} />
                    <div className="wf-action-btn" />
                 </div>
                 <div className="wf-grid">
                    <div className="wf-card-lg">
                      <div className="wf-chart-fill" />
                    </div>
                    <div className="wf-card-sm">
                      <div className="wf-listItem"><div className="wf-circle" /><div className="wf-line-1" /></div>
                      <div className="wf-listItem"><div className="wf-circle" /><div className="wf-line-2" /></div>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* STATS BAR */}
        <section className="stats-section">
          <div className="stats-grid">
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} className="stats-item">
              <div className="stat-number" style={{ color: 'var(--text-main)' }}>10x</div>
              <div className="stat-label">Faster campaign deployment</div>
            </motion.div>
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: 0.1}} viewport={{once:true}} className="stats-item">
              <div className="stat-number" style={{ color: '#10b981' }}>62%</div>
              <div className="stat-label">Lower Customer Acquisition Cost</div>
            </motion.div>
            <motion.div initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} transition={{delay: 0.2}} viewport={{once:true}} className="stats-item">
              <div className="stat-number" style={{ color: 'var(--primary-color)' }}>7.2x</div>
              <div className="stat-label">Average pipeline generation lift</div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES (5 Modules) */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Outcome-driven engineering.</h2>
            <p className="section-desc">Stop managing platforms. Start managing results. We abstracted away the complexity so you can focus strictly on growth velocity.</p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`feature-card ${i === 3 ? 'wide-1' : ''} ${i === 4 ? 'wide-2' : ''}`}
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.name}</h3>
                <p className="feature-text">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS (Strip) */}
        <section className="how-it-works-section">
          <div className="hiw-container">
            <div className="section-header">
              <h2 className="section-title">Value captured on day one.</h2>
              <p className="section-desc">No multi-month onboarding cliffs. Setup takes minutes.</p>
            </div>

            <div className="hiw-grid">
              {/* Connecting line for desktop */}
              <div className="hiw-connector" />
              
              {[
                { step: "01", title: "Connect", desc: "Sync your existing CMS via our one-click authenticated connector." },
                { step: "02", title: "Scan", desc: "Our AI indexes your current architecture and isolates underperforming cohorts." },
                { step: "03", title: "Deploy", desc: "Approve the generated experiments logic and watch personalisations go live." },
                { step: "04", title: "Scale", desc: "Winning variants automatically hardcode themselves over time." }
              ].map((s, i) => (
                <div key={i} className="hiw-step">
                  <div className="hiw-bubble">{s.step}</div>
                  <h4 className="hiw-title">{s.title}</h4>
                  <p className="hiw-text">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="audience-section">
          <div className="audience-grid">
            
            {/* The right fit */}
            <div className="audience-panel">
              <div className="audience-header">
                <CheckCircle2 size={28} className="icon-success" />
                <h3 className="audience-title">Who it's for</h3>
              </div>
              <ul className="audience-list">
                <li className="audience-item">
                  <div className="audience-icon icon-success"><LayoutDashboard size={20} /></div>
                  <div>
                    <h5 className="audience-item-title">Growth teams scaling fast</h5>
                    <p className="audience-item-text">Teams constrained by developer bandwidth wanting to execute rapidly.</p>
                  </div>
                </li>
                <li className="audience-item">
                  <div className="audience-icon icon-success"><Bot size={20} /></div>
                  <div>
                    <h5 className="audience-item-title">AI-forward founders</h5>
                    <p className="audience-item-text">Leaders explicitly optimizing their product footprint for LLM discoverability.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* The wrong fit */}
            <div className="audience-panel">
              <div className="audience-header">
                <XCircle size={28} className="icon-danger" />
                <h3 className="audience-title">Who it's not for</h3>
              </div>
               <ul className="audience-list">
                <li className="audience-item wrong-fit">
                  <div className="audience-icon icon-danger"><Code2 size={20} /></div>
                  <div>
                    <h5 className="audience-item-title">Custom backend hobbyists</h5>
                    <p className="audience-item-text">If you want to write your own targeting rules explicitly via code, this platform abstracts too much.</p>
                  </div>
                </li>
                <li className="audience-item wrong-fit">
                  <div className="audience-icon icon-danger"><Users2 size={20} /></div>
                  <div>
                    <h5 className="audience-item-title">Legacy mass-marketers</h5>
                    <p className="audience-item-text">If personalization to you means 'First Name' tags in emails, you won't need our deep capabilities.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="home-footer">
        <div className="footer-logo">
          <Zap size={18} style={{ color: 'var(--primary-color)' }} /> MarTech
        </div>
        <p>&copy; {new Date().getFullYear()} MarTech. Built for modern growth.</p>
      </footer>
    </div>
  );
};

export default Home;
