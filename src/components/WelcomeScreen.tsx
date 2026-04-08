import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TestType } from '../types';
import { TEST_MENU } from '../types';
import { getResults, getInProgress, clearInProgress } from '../utils/storage';
import type { InProgressState } from '../utils/storage';

interface Props {
  onStart: (name: string, types: TestType[]) => void;
  onResume: (state: InProgressState) => void;
  onHistory: () => void;
}

export default function WelcomeScreen({ onStart, onResume, onHistory }: Props) {
  const [name, setName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<TestType>>(new Set());
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => localStorage.getItem('spectrum_disclaimer') === 'accepted');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const hasHistory = getResults().length > 0;
  const [loadProgress, setLoadProgress] = useState(-1); // -1=not started, 0-99=loading, 100=done
  const [showActivated, setShowActivated] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [savedState, setSavedState] = useState<InProgressState | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSavedState(getInProgress());
  }, []);

  // Close tooltip on outside tap
  useEffect(() => {
    if (!openTooltip) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setOpenTooltip(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [openTooltip]);

  // Boot animation
  const bootRan = useRef(false);
  useEffect(() => {
    if (bootRan.current) return;
    bootRan.current = true;
    const t = setTimeout(() => {
      setLoadProgress(0);
      let p = 0;
      const tick = setInterval(() => {
        p += Math.random() * 3 + 1;
        if (p >= 100) { p = 100; clearInterval(tick); }
        setLoadProgress(Math.min(Math.floor(p), 100));
      }, 100);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loadProgress < 100) return;
    const t1 = setTimeout(() => setShowActivated(true), 300);
    const t2 = setTimeout(() => setBootDone(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loadProgress]);

  const toggleTest = (type: TestType) => {
    setSelectedTests(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      setNameConfirmed(true);
    }
  };

  const handleStart = () => {
    if (name.trim() && selectedTests.size > 0) {
      localStorage.setItem('spectrum_disclaimer', 'accepted');
      setDisclaimerAccepted(true);
      const ordered = TEST_MENU.filter(t => selectedTests.has(t.type)).map(t => t.type);
      onStart(name.trim(), ordered);
    }
  };

  // Keyboard shortcuts — only for test selection after name is confirmed
  useEffect(() => {
    if (!nameConfirmed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDisclaimer) {
        if (e.key.toLowerCase() === 'y') handleStart();
        else if (e.key.toLowerCase() === 'n' || e.key === 'Escape') setShowDisclaimer(false);
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= TEST_MENU.length) {
        toggleTest(TEST_MENU[num - 1].type);
      } else if (e.key === 'Enter' && selectedTests.size > 0) {
        if (disclaimerAccepted) handleStart();
        else setShowDisclaimer(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nameConfirmed, name, selectedTests, showDisclaimer]);

  const lineVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.08, duration: 0.15, ease: 'easeOut' as const },
    }),
  };

  return (
    <div className="flex min-h-screen items-start justify-center px-4 pt-[15vh] pb-6 sm:pt-[18vh] sm:px-6">
      <div className="w-full max-w-[600px]">
        {/* Single terminal window */}
        <div className="border border-terminal-border p-5 border-glow-green font-mono text-xs leading-6">

          {/* Boot sequence */}
          <motion.div custom={0} initial="hidden" animate="visible" variants={lineVariants} className="text-phosphor text-glow-green">
            {'>'} SPECTRUM v1.0
          </motion.div>

          {/* Loading bar */}
          {loadProgress >= 0 && !showActivated && (
            <div className="text-phosphor-dim">
              {'>'} Autism Detection Toolkit{' '}
              <span className="text-phosphor">
                [{'█'.repeat(Math.floor(loadProgress / 8))}{'░'.repeat(12 - Math.floor(loadProgress / 8))}] {loadProgress}%
              </span>
            </div>
          )}

          {/* Activated — replaces loading bar */}
          {showActivated && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="text-phosphor text-glow-green">
              {'>'} Autism Detection Toolkit Activated
            </motion.div>
          )}

          {/* Resume panel */}
          {bootDone && savedState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="border border-amber p-4 mt-3 border-glow-amber"
            >
              <div className="text-amber uppercase tracking-wider mb-2">
                {'>'} INTERRUPTED SESSION DETECTED
              </div>
              <div className="text-phosphor-dim mb-3">
                Test: <span className="text-phosphor">{savedState.testType}</span>
                {' | '}Progress: <span className="text-phosphor">{savedState.answers.length}/{savedState.totalQuestions}</span>
                {' | '}Subject: <span className="text-phosphor">{savedState.userName}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onResume(savedState)}
                  className="flex-1 border border-phosphor bg-phosphor-faint py-2 uppercase tracking-wider text-phosphor text-glow-green transition-all duration-150 hover:bg-phosphor/20 border-glow-green"
                >
                  {'>'} RESUME
                </button>
                <button
                  onClick={() => { clearInProgress(); setSavedState(null); }}
                  className="flex-1 border border-terminal-border py-2 uppercase tracking-wider text-phosphor-dim transition-all duration-150 hover:border-terminal-border-bright hover:text-phosphor"
                >
                  {'>'} DISCARD
                </button>
              </div>
            </motion.div>
          )}

          {/* Name input */}
          {bootDone && !nameConfirmed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="text-phosphor-dim">{'>'} ENTER SUBJECT NAME:</div>
              <div className="flex items-baseline">
                <span className="text-phosphor-dim mr-1">{'>'}</span>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleNameSubmit(); }}
                    className="w-full bg-transparent border-none outline-none text-phosphor text-glow-green text-xs font-mono caret-transparent leading-6"
                    autoFocus
                  />
                  <span className="absolute top-0 left-0 pointer-events-none text-xs font-mono text-transparent select-none leading-6" aria-hidden="true">
                    {name}<span className="text-phosphor cursor-blink">█</span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* After name confirmed */}
          {nameConfirmed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <div className="text-phosphor-dim">
                {'>'} SUBJECT: <span className="text-phosphor text-glow-green">{name}</span>
                <button onClick={() => setNameConfirmed(false)} className="text-phosphor-faint hover:text-phosphor ml-2 transition-colors">[edit]</button>
              </div>
              <div className="text-phosphor-dim">{'>'} SELECT TESTS:</div>

              {/* Test grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 my-2" ref={tooltipRef}>
                {TEST_MENU.map((item, idx) => {
                  const isSelected = selectedTests.has(item.type);
                  const isTooltipOpen = openTooltip === item.type;
                  return (
                    <div key={item.type} className="relative group">
                      <button
                        onClick={() => toggleTest(item.type)}
                        className={`w-full border p-3 text-left transition-all duration-150 min-h-[52px] ${
                          isSelected
                            ? 'border-phosphor bg-phosphor-faint border-glow-green'
                            : 'border-terminal-border hover:border-terminal-border-bright'
                        }`}
                      >
                        <div>
                          <span className="text-amber">[{idx + 1}]</span>{' '}
                          <span className={isSelected ? 'text-phosphor text-glow-green' : 'text-phosphor-dim'}>{item.label}</span>
                        </div>
                        <div className="text-[10px] text-phosphor-dim opacity-60">{item.desc}</div>
                      </button>
                      {/* Info button — tap to toggle tooltip on mobile */}
                      <button
                        aria-label={`Info: ${item.label}`}
                        onClick={e => { e.stopPropagation(); setOpenTooltip(isTooltipOpen ? null : item.type); }}
                        className="absolute top-1.5 right-1.5 text-[9px] text-phosphor-faint hover:text-phosphor-dim font-mono px-1 py-0.5 border border-transparent hover:border-phosphor-faint transition-colors"
                      >
                        [?]
                      </button>
                      {/* Tooltip — hover on desktop, tap-toggle on mobile */}
                      <div className={`absolute left-0 right-0 bottom-full mb-1 z-50 ${isTooltipOpen ? 'block' : 'hidden group-hover:block'}`}>
                        <div className="border border-phosphor/50 bg-terminal-bg p-3 text-[10px] leading-relaxed text-phosphor-dim font-mono shadow-lg shadow-phosphor/5">
                          <span className="text-amber">{'>'}</span> {item.tooltip}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTests.size > 1 && (
                <div className="text-cyan">{'>'} BATTERY: {selectedTests.size} tests queued</div>
              )}

              {/* Start / Disclaimer */}
              {!showDisclaimer ? (
                <button
                  onClick={() => disclaimerAccepted ? handleStart() : setShowDisclaimer(true)}
                  disabled={selectedTests.size === 0}
                  className="w-full border border-phosphor bg-phosphor-faint py-3 sm:py-2.5 mt-2 uppercase tracking-wider text-phosphor text-glow-green transition-all duration-150 hover:bg-phosphor/20 disabled:opacity-30 disabled:cursor-not-allowed border-glow-green min-h-[48px]"
                >
                  {'>'} {selectedTests.size > 1 ? 'INITIALIZE BATTERY' : 'INITIALIZE TEST'}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="border border-amber/60 p-4 mt-3"
                >
                  <div className="text-amber mb-2">{'>'} DISCLAIMER</div>
                  <div className="text-phosphor-dim text-[10px] leading-relaxed space-y-1.5">
                    <p>This application is provided for <span className="text-phosphor">informational and educational purposes only</span>. It is not a medical device and does not provide clinical diagnoses.</p>
                    <p>Results should be interpreted by a qualified healthcare professional. No screening tool can replace a comprehensive diagnostic assessment.</p>
                    <p>All questionnaires are the intellectual property of their respective authors and institutions. This implementation is for personal screening use only and is not licensed for commercial or clinical deployment without appropriate permissions.</p>
                    <p className="text-phosphor-faint">AQ-50 &copy; Baron-Cohen et al. | CAT-Q &copy; Hull et al. | RAADS-R &copy; Ritvo et al. | EQ/SQ &copy; Baron-Cohen &amp; Wheelwright | RBQ-2A &copy; Barrett et al.</p>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleStart}
                      className="flex-1 border border-phosphor bg-phosphor-faint py-2 uppercase tracking-wider text-phosphor text-glow-green transition-all duration-150 hover:bg-phosphor/20 border-glow-green"
                    >
                      [Y] ACCEPT
                    </button>
                    <button
                      onClick={() => setShowDisclaimer(false)}
                      className="flex-1 border border-terminal-border py-2 uppercase tracking-wider text-phosphor-dim transition-all duration-150 hover:border-terminal-border-bright hover:text-phosphor"
                    >
                      [N] DECLINE
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Below terminal: history + disclaimer */}
        <div className="mt-4 space-y-3">
          {bootDone && hasHistory && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.3 }} className="text-center">
              <button
                onClick={onHistory}
                className="text-xs text-phosphor-dim hover:text-cyan transition-colors duration-150 font-mono"
              >
                {'>'} VIEW PAST RESULTS [HISTORY]
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
