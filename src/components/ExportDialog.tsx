import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TestResult } from '../types';
import { getScoreCategory } from '../utils/scoring';
import { exportResultPDF, exportMultipleResultsPDF } from '../utils/pdf';

interface Props {
  currentResult: TestResult;
  allResults: TestResult[];
  onClose: () => void;
}

export default function ExportDialog({ currentResult, allResults, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set([currentResult.id]));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allResults.map(r => r.id)));
  const selectThisOnly = () => setSelected(new Set([currentResult.id]));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'a':
        case 'A':
          e.preventDefault();
          selectAll();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          selectThisOnly();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Enter':
          e.preventDefault();
          handleExport();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  const handleExport = () => {
    const toExport = allResults.filter(r => selected.has(r.id));
    if (toExport.length === 0) return;
    if (toExport.length === 1) {
      exportResultPDF(toExport[0]);
    } else {
      exportMultipleResultsPDF(toExport);
    }
    onClose();
  };

  const categoryTag = (result: TestResult) => {
    const cat = getScoreCategory(result.testType, result.totalScore);
    const config = {
      low: { color: 'text-phosphor', label: 'LOW' },
      borderline: { color: 'text-amber', label: 'BRD' },
      high: { color: 'text-term-red', label: 'HIGH' },
    };
    return config[cat];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15, ease: 'easeOut' as const }}
          className="w-full max-w-[520px] mx-4 border border-terminal-border bg-terminal-bg border-glow-green"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-terminal-border px-5 py-3">
            <div className="text-xs text-phosphor font-mono text-glow-green uppercase tracking-wider">
              {'>'} PDF EXPORT — SELECT RESULTS
            </div>
            <div className="text-xs text-phosphor-faint font-mono mt-1">
              {allResults.length} result{allResults.length !== 1 ? 's' : ''} available | {selected.size} selected
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 px-5 py-2 border-b border-terminal-border">
            <button
              onClick={selectAll}
              className="text-xs font-mono text-phosphor-dim hover:text-phosphor transition-colors duration-150 uppercase"
            >
              [A] SELECT ALL
            </button>
            <span className="text-phosphor-faint">|</span>
            <button
              onClick={selectThisOnly}
              className="text-xs font-mono text-phosphor-dim hover:text-phosphor transition-colors duration-150 uppercase"
            >
              [T] THIS ONLY
            </button>
          </div>

          {/* Results list */}
          <div className="px-5 py-3 max-h-[300px] overflow-y-auto space-y-1">
            {allResults.map(result => {
              const isChecked = selected.has(result.id);
              const isCurrent = result.id === currentResult.id;
              const tag = categoryTag(result);

              return (
                <button
                  key={result.id}
                  onClick={() => toggle(result.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left font-mono transition-colors duration-150 border ${
                    isChecked
                      ? 'border-terminal-border-bright bg-phosphor-faint'
                      : 'border-terminal-border hover:border-terminal-border-bright'
                  }`}
                >
                  {/* Checkbox */}
                  <span className={`text-xs ${isChecked ? 'text-phosphor' : 'text-phosphor-faint'}`}>
                    {isChecked ? '[X]' : '[ ]'}
                  </span>

                  {/* Date */}
                  <span className="text-xs text-phosphor-faint w-20 shrink-0">
                    {new Date(result.date).toLocaleDateString()}
                  </span>

                  {/* Test type */}
                  <span className="text-xs text-cyan-dim w-14 shrink-0 text-center">
                    {result.testType}
                  </span>

                  {/* Subject */}
                  <span className="text-xs text-phosphor-dim flex-1 truncate">
                    {result.userName}
                  </span>

                  {/* Score */}
                  <span className="text-xs text-phosphor tabular-nums w-16 text-right shrink-0">
                    {result.totalScore}/{result.maxScore}
                  </span>

                  {/* Category */}
                  <span className={`text-xs font-bold w-10 text-center shrink-0 ${tag.color}`}>
                    {tag.label}
                  </span>

                  {/* Current marker */}
                  {isCurrent && (
                    <span className="text-xs text-cyan-dim shrink-0">&lt;</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 px-5 py-3 border-t border-terminal-border">
            <button
              onClick={handleExport}
              disabled={selected.size === 0}
              className={`flex-1 border py-2.5 text-xs font-mono uppercase transition-all duration-150 ${
                selected.size > 0
                  ? 'border-phosphor bg-phosphor-faint text-phosphor text-glow-green hover:bg-phosphor/20 border-glow-green'
                  : 'border-terminal-border text-phosphor-faint cursor-not-allowed'
              }`}
            >
              {'>'} EXPORT {selected.size > 1 ? `${selected.size} RESULTS` : 'PDF'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-terminal-border py-2.5 text-xs font-mono uppercase text-phosphor-dim hover:text-phosphor hover:border-terminal-border-bright transition-all duration-150"
            >
              [ESC] CANCEL
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
