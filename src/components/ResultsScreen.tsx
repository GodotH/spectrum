import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TestResult, TestType } from '../types';
import { getSubscaleLabels, TEST_MENU } from '../types';
import { getScoreCategory, getSubscaleMax, getNormReferences } from '../utils/scoring';
import type { NormReference } from '../utils/scoring';
import { exportResultPDF } from '../utils/pdf';
import { getResults } from '../utils/storage';
import ExportDialog from './ExportDialog';

interface Props {
  result: TestResult;
  onHome: () => void;
  onHistory: () => void;
  onStartTest?: (type: TestType) => void;
  isBattery?: boolean;
  hasNextInQueue?: boolean;
  nextTestType?: TestType | null;
  queueIndex?: number;
  queueTotal?: number;
  onAdvanceQueue?: () => void;
}

function AsciiBar({ value, max, color }: { value: number; max: number; color: string }) {
  const barWidth = 20;
  const filled = Math.round((value / max) * barWidth);
  const empty = barWidth - filled;
  return (
    <span className="font-mono text-xs ascii-bar">
      <span className={color}>{'█'.repeat(filled)}</span>
      <span className="text-phosphor-faint">{'░'.repeat(empty)}</span>
    </span>
  );
}

const REF_COLORS: Record<NormReference['color'], string> = {
  green: 'text-phosphor',
  amber: 'text-amber',
  red: 'text-term-red',
};

function ScoreContextBar({ testType, score }: { testType: TestType; score: number }) {
  const norm = getNormReferences(testType);
  const barMax = norm.max;
  const barWidth = 40; // character width of the bar

  // For inverse tests (EQ), we flip the visual: position 0 on right, max on left
  const toPosition = (val: number) => {
    const ratio = Math.min(Math.max(val / barMax, 0), 1);
    return norm.inverse ? 1 - ratio : ratio;
  };

  const scorePos = toPosition(score);
  const scoreCharIdx = Math.round(scorePos * (barWidth - 1));

  // Build gradient zones from references sorted by visual position
  const sortedRefs = [...norm.references].sort((a, b) => toPosition(a.value) - toPosition(b.value));

  // Determine color for each bar character based on reference zones
  const getCharColor = (charIdx: number): NormReference['color'] => {
    const charRatio = charIdx / (barWidth - 1);
    // Find which zone this character falls in
    for (let i = sortedRefs.length - 1; i >= 0; i--) {
      const refPos = toPosition(sortedRefs[i].value);
      if (charRatio >= refPos) return sortedRefs[i].color;
    }
    return sortedRefs[0]?.color || 'green';
  };

  // Build the bar characters
  const barChars: { char: string; colorClass: string }[] = [];
  for (let i = 0; i < barWidth; i++) {
    if (i === scoreCharIdx) {
      barChars.push({ char: '▓', colorClass: 'text-white' });
    } else {
      const zone = getCharColor(i);
      const dimSuffix = zone === 'green' ? 'text-phosphor-faint' : zone === 'amber' ? 'text-amber-faint' : 'text-term-red-dim';
      barChars.push({ char: '░', colorClass: dimSuffix });
    }
  }

  // Build reference marker line — place labels at their positions
  type Marker = { charIdx: number; label: string; color: NormReference['color'] };
  const markers: Marker[] = sortedRefs.map(ref => ({
    charIdx: Math.round(toPosition(ref.value) * (barWidth - 1)),
    label: ref.label,
    color: ref.color,
  }));

  // Build the tick line: place '|' at each marker position
  const tickLine: { char: string; colorClass: string }[] = Array.from({ length: barWidth }, () => ({
    char: ' ',
    colorClass: 'text-phosphor-faint',
  }));
  for (const m of markers) {
    if (m.charIdx >= 0 && m.charIdx < barWidth) {
      tickLine[m.charIdx] = { char: '│', colorClass: REF_COLORS[m.color] };
    }
  }

  // Build the score pointer line
  const pointerLine: { char: string; colorClass: string }[] = Array.from({ length: barWidth }, () => ({
    char: ' ',
    colorClass: 'text-phosphor-faint',
  }));
  if (scoreCharIdx >= 0 && scoreCharIdx < barWidth) {
    pointerLine[scoreCharIdx] = { char: '▲', colorClass: 'text-white' };
  }

  // Direction labels
  const leftLabel = norm.inverse ? 'MORE AUTISTIC' : 'NEUROTYPICAL';
  const rightLabel = norm.inverse ? 'NEUROTYPICAL' : 'MORE AUTISTIC';

  return (
    <div className="mt-3 space-y-0 font-mono text-[10px] leading-tight select-none">
      <div className="text-phosphor-dim text-[10px] mb-1">{'>'} CLINICAL CONTEXT:</div>
      {/* Direction labels */}
      <div className="flex justify-between" style={{ width: `${barWidth}ch` }}>
        <span className={norm.inverse ? 'text-term-red-dim' : 'text-phosphor-dim'}>{leftLabel}</span>
        <span className={norm.inverse ? 'text-phosphor-dim' : 'text-term-red-dim'}>{rightLabel}</span>
      </div>
      {/* Reference tick marks */}
      <div className="whitespace-pre" style={{ width: `${barWidth}ch` }}>
        {tickLine.map((t, i) => (
          <span key={i} className={t.colorClass}>{t.char}</span>
        ))}
      </div>
      {/* The bar itself */}
      <div className="whitespace-pre" style={{ width: `${barWidth}ch` }}>
        {barChars.map((b, i) => (
          <span key={i} className={b.colorClass}>{b.char}</span>
        ))}
      </div>
      {/* Score pointer */}
      <div className="whitespace-pre" style={{ width: `${barWidth}ch` }}>
        {pointerLine.map((p, i) => (
          <span key={i} className={p.colorClass}>{p.char}</span>
        ))}
      </div>
      {/* Score value label centered on pointer */}
      <div className="whitespace-pre text-white font-bold" style={{ width: `${barWidth}ch` }}>
        {(() => {
          const label = `YOU: ${score}`;
          const startIdx = Math.max(0, Math.min(scoreCharIdx - Math.floor(label.length / 2), barWidth - label.length));
          return ' '.repeat(startIdx) + label;
        })()}
      </div>
      {/* Reference labels */}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
        {sortedRefs.map((ref, i) => (
          <span key={i} className={`${REF_COLORS[ref.color]}`}>
            <span className={REF_COLORS[ref.color]}>│</span> {ref.label}: {ref.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResultsScreen({ result, onHome, onHistory, onStartTest, isBattery, hasNextInQueue, nextTestType, queueIndex, queueTotal, onAdvanceQueue }: Props) {
  const category = getScoreCategory(result.testType, result.totalScore);
  const [countdown, setCountdown] = useState(hasNextInQueue ? 10 : 0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [countdownPaused, setCountdownPaused] = useState(false);

  const handleExportClick = () => {
    setCountdownPaused(true);
    const allResults = getResults();
    if (allResults.length <= 1) {
      exportResultPDF(result);
    } else {
      setShowExportDialog(true);
    }
  };

  // F1/F2/F3 keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showExportDialog) return;
      switch (e.key) {
        case 'F1':
          e.preventDefault();
          handleExportClick();
          break;
        case 'F2':
          e.preventDefault();
          setCountdownPaused(true);
          onHistory();
          break;
        case 'F3':
          e.preventDefault();
          onHome();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExportDialog, onHistory, onHome]);

  // Auto-advance countdown in battery mode
  useEffect(() => {
    if (!isBattery || !hasNextInQueue || !onAdvanceQueue || countdownPaused || showExportDialog) return;
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onAdvanceQueue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result.id, countdownPaused, showExportDialog]); // reset on new result

  const categoryConfig = {
    low: { color: 'text-phosphor', glow: 'text-glow-green', border: 'border-phosphor', label: 'BELOW_THRESHOLD', barColor: 'text-phosphor' },
    borderline: { color: 'text-amber', glow: 'text-glow-amber', border: 'border-amber', label: 'BORDERLINE', barColor: 'text-amber' },
    high: { color: 'text-term-red', glow: '', border: 'border-term-red', label: 'ABOVE_THRESHOLD', barColor: 'text-term-red' },
  };

  const c = categoryConfig[category];

  const lineVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.06, duration: 0.15, ease: 'easeOut' as const },
    }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[560px] space-y-4">
        {/* Header */}
        <div className="border border-terminal-border p-5 border-glow-green">
          <motion.div custom={0} initial="hidden" animate="visible" variants={lineVariants}>
            <span className="text-xs text-phosphor-dim font-mono">{'>'} RESULTS COMPILED</span>
          </motion.div>
          <motion.div custom={1} initial="hidden" animate="visible" variants={lineVariants} className="mt-1">
            <span className="text-xs text-phosphor-faint font-mono">
              {'>'} SUBJECT: {result.userName} | TEST: {result.testType} | DATE: {new Date(result.date).toLocaleDateString()}
            </span>
          </motion.div>
        </div>

        {/* Score output */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className={`border ${c.border} p-5`}
        >
          <div className="space-y-2 font-mono">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-phosphor-dim">{'>'} SCORE:</span>
              <span className={`text-3xl font-bold tabular-nums ${c.color} ${c.glow}`}>
                {result.totalScore}
              </span>
              <span className="text-sm text-phosphor-faint">/ {result.maxScore}</span>
            </div>
            <div>
              <span className="text-xs text-phosphor-dim">{'>'} STATUS: </span>
              <span className={`text-xs font-bold ${c.color} ${c.glow}`}>{c.label}</span>
            </div>
            {/* Score bar */}
            <div className="mt-2">
              <AsciiBar value={result.totalScore} max={result.maxScore} color={c.barColor} />
              <span className="text-xs text-phosphor-dim ml-2">
                {Math.round((result.totalScore / result.maxScore) * 100)}%
              </span>
            </div>
            {/* Clinical context bar */}
            <ScoreContextBar testType={result.testType} score={result.totalScore} />
          </div>
        </motion.div>

        {/* Interpretation */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="border border-terminal-border p-5"
        >
          <div className="text-xs text-phosphor-dim font-mono mb-2">{'>'} INTERPRETATION:</div>
          <p className="text-sm leading-relaxed text-phosphor-dim font-mono">{result.interpretation}</p>
        </motion.div>

        {/* Subscale breakdown */}
        {result.subscaleScores && (
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            className="border border-terminal-border p-5"
          >
            <div className="text-xs text-phosphor-dim font-mono mb-3">{'>'} SUBSCALE BREAKDOWN:</div>
            <div className="space-y-2">
              {Object.keys(result.subscaleScores).map(subscale => {
                const score = result.subscaleScores![subscale];
                const labels = getSubscaleLabels(result.testType);
                const maxScores = getSubscaleMax(result.testType);
                const maxVal = maxScores[subscale] || 10;
                return (
                  <div key={subscale} className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-40 text-phosphor-dim truncate">{labels[subscale] || subscale}</span>
                    <AsciiBar value={score} max={maxVal} color="text-cyan" />
                    <span className="text-cyan-dim w-10 text-right">{score}/{maxVal}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={lineVariants}
          className="flex gap-2"
        >
          <button
            onClick={handleExportClick}
            className="flex-1 border border-terminal-border py-2.5 text-xs font-mono uppercase text-phosphor-dim hover:text-phosphor hover:border-terminal-border-bright transition-all duration-150"
          >
            [F1] EXPORT PDF
          </button>
          <button
            onClick={onHistory}
            className="flex-1 border border-terminal-border py-2.5 text-xs font-mono uppercase text-phosphor-dim hover:text-phosphor hover:border-terminal-border-bright transition-all duration-150"
          >
            [F2] HISTORY
          </button>
          <button
            onClick={onHome}
            className="flex-1 border border-phosphor bg-phosphor-faint py-2.5 text-xs font-mono uppercase text-phosphor text-glow-green hover:bg-phosphor/20 transition-all duration-150 border-glow-green"
          >
            [F3] NEW TEST
          </button>
        </motion.div>

        {/* Battery — next test in queue */}
        {isBattery && hasNextInQueue && nextTestType && onAdvanceQueue && (
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            className="border border-cyan p-5"
          >
            <div className="text-xs text-cyan font-mono mb-1">
              {'>'} BATTERY PROGRESS: {(queueIndex ?? 0) + 1}/{queueTotal} COMPLETE
            </div>
            <div className="text-xs text-phosphor-faint font-mono mb-3">
              {countdownPaused || showExportDialog
                ? <><span className="text-amber">{'>'} AUTO-ADVANCE PAUSED</span></>
                : <>{'>'} Auto-advancing in {countdown}s...</>
              }
            </div>
            <button
              onClick={onAdvanceQueue}
              className="w-full border border-cyan bg-cyan/10 py-3 text-sm font-mono uppercase tracking-wider text-cyan transition-all duration-150 hover:bg-cyan/20"
            >
              {'>'} NEXT: {TEST_MENU.find(t => t.type === nextTestType)?.label ?? nextTestType} [{TEST_MENU.find(t => t.type === nextTestType)?.desc}]
            </button>
          </motion.div>
        )}

        {/* Battery complete */}
        {isBattery && !hasNextInQueue && (
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={lineVariants}
            className="border border-phosphor p-5 border-glow-green"
          >
            <div className="text-xs text-phosphor text-glow-green font-mono mb-1">
              {'>'} BATTERY COMPLETE: {queueTotal}/{queueTotal} tests finished
            </div>
            <div className="text-xs text-phosphor-dim font-mono">
              {'>'} All results saved. View history for full report.
            </div>
          </motion.div>
        )}

        {/* Continue — suggest remaining tests (only in single-test mode) */}
        {!isBattery && onStartTest && (() => {
          const done = new Set(getResults().map(r => r.testType));
          const remaining = TEST_MENU.filter(t => !done.has(t.type));
          if (remaining.length === 0) return null;
          return (
            <motion.div
              custom={7}
              initial="hidden"
              animate="visible"
              variants={lineVariants}
              className="border border-terminal-border p-4"
            >
              <div className="text-xs text-phosphor-dim font-mono mb-2">{'>'} CONTINUE — {remaining.length} test{remaining.length > 1 ? 's' : ''} remaining:</div>
              <div className="flex flex-wrap gap-2">
                {remaining.map(t => (
                  <div key={t.type} className="relative group">
                    <button
                      onClick={() => onStartTest(t.type)}
                      className="border border-terminal-border px-3 py-1.5 text-xs font-mono text-phosphor-dim hover:text-phosphor hover:border-terminal-border-bright transition-all duration-150"
                    >
                      {t.desc}
                    </button>
                    <div className="absolute left-0 bottom-full mb-1 z-50 hidden group-hover:block w-64">
                      <div className="border border-phosphor/50 bg-terminal-bg p-2 text-[10px] leading-relaxed text-phosphor-dim font-mono shadow-lg shadow-phosphor/5">
                        <span className="text-amber">{'>'}</span> {t.tooltip}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })()}

        {/* Disclaimer */}
        <p className="text-center text-xs text-phosphor-faint font-mono">
          WARNING: Screening tool only. Not a diagnostic instrument.
        </p>
      </div>

      {/* Export dialog */}
      {showExportDialog && (
        <ExportDialog
          currentResult={result}
          allResults={getResults()}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
