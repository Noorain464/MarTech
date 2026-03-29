import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const questions = [
  {
    id: 'role',
    question: "What's your role?",
    description: "Helps us show you the right modules first.",
    type: 'single',
    options: [
      "Growth marketer", "Content lead", "Performance marketer",
      "Marketing director / CMO", "Founder / CEO", "Developer / tech lead",
      "Agency / consultant"
    ]
  },
  {
    id: 'primaryGoal',
    question: "What's your primary goal right now?",
    description: "We'll set up your workspace around this goal.",
    type: 'multiple',
    options: [
      "Scale content output", "Improve SEO / organic", "Improve paid ad ROI",
      "Personalise website for different audiences", "Prepare for AI search", "All of the above"
    ]
  },
  {
    id: 'businessType',
    question: "What kind of business are you?",
    type: 'single',
    options: [
      "B2B SaaS", "E-commerce / DTC", "Agency or consultancy",
      "Media / publisher", "Enterprise / large brand", "Other"
    ]
  },
  {
    id: 'teamSize',
    question: "How big is your marketing team?",
    description: "Helps us calibrate workflow complexity.",
    type: 'single',
    options: [
      "Just me", "2-5 people", "6-15 people", "15+ people"
    ]
  },
  {
    id: 'referralSource',
    question: "Where did you hear about us?",
    type: 'single',
    options: [
      "LinkedIn", "A colleague / referral", "Google search",
      "Newsletter", "Podcast", "Event / hackathon", "Other"
    ]
  }
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    role: '',
    primaryGoal: [],
    businessType: '',
    teamSize: '',
    referralSource: ''
  });
  const [saving, setSaving] = useState(false);

  const { user, updateOnboarding } = useAuth();
  const navigate = useNavigate();

  const currentQ = questions[step];
  const progressPercentage = ((step + 1) / questions.length) * 100;

  const handleSelect = (option) => {
    if (currentQ.type === 'single') {
      setAnswers({ ...answers, [currentQ.id]: option });
      // Auto-advance on single select for better UX
      setTimeout(() => {
        handleNext();
      }, 300);
    } else {
      const currentSelections = answers[currentQ.id];
      if (currentSelections.includes(option)) {
        setAnswers({
          ...answers,
          [currentQ.id]: currentSelections.filter(i => i !== option)
        });
      } else {
        setAnswers({
          ...answers,
          [currentQ.id]: [...currentSelections, option]
        });
      }
    }
  };

  const handleNext = async () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    setSaving(true);
    try {
      const res = await fetch('https://martech-7l0n.onrender.com/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(answers),
      });

      if (!res.ok) throw new Error('Failed to save onboarding data');

      await updateOnboarding(answers);
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      alert('Something went wrong saving your data.');
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (option) => {
    if (currentQ.type === 'single') {
      return answers[currentQ.id] === option;
    }
    return answers[currentQ.id].includes(option);
  };

  return (
    <div className="center-content" style={{ backgroundColor: 'var(--bg-color)', backgroundImage: 'radial-gradient(circle at top right, rgba(0,0,0,0.02) 0%, transparent 60%)' }}>
      <Card style={{ padding: '3.5rem', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>

        {/* Sleek Progress Bar */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ height: '100%', backgroundColor: 'var(--primary-color)' }}
            />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginTop: '0.75rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Question {step + 1} of {questions.length}
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                {currentQ.question}
              </h1>
              {currentQ.description && (
                <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  {currentQ.description}
                </p>
              )}
              {!currentQ.description && <div style={{ marginBottom: '2rem' }} />}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {currentQ.options.map((opt) => (
                  <Button
                    key={opt}
                    variant={isSelected(opt) ? 'pill-active' : 'pill'}
                    onClick={() => handleSelect(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={saving || step === 0}
              style={{ visibility: step > 0 ? 'visible' : 'hidden' }}
            >
              &larr; Back
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={handleSkip}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s' }}
              disabled={saving}
              onMouseOver={(e) => e.target.style.color = 'var(--text-main)'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
            >
              Skip
            </button>
            <Button variant="primary" onClick={handleNext} disabled={saving}>
              {step === questions.length - 1 ? (saving ? 'Saving...' : 'Complete setup') : 'Continue \u2192'}
            </Button>
          </div>
        </div>

      </Card>
    </div>
  );
};

export default Onboarding;
