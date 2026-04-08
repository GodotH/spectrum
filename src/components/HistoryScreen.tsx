import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getResults, deleteResult } from '../utils/storage';
import { exportResultPDF } from '../utils/pdf';
import { getScoreCategory } from '../utils/scoring';
import type { TestResult } from '../types';

interface Props {
  onHome: () => void;
}

export default function HistoryScreen({ onHome }: Props) {
  const [results, setResults] = useState<TestResult[]>(() => getResults().reverse());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onHome();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onHome]);

  const handleDelete = (id: string) => {
    deleteResult(id);
    setResults(getResults().reverse());
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
    <div className="flex min-h-screen flex-col items-center p-6">
      <div className="w-full max-w-[560px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-terminal-border pb-3">
          <div>
            <h1 className="text-sm font-mono uppercase tracking-wider text-phosphor text-glow-green">
              {'>'} RESULTS LOG
            </h1>
            <span className="text-xs text-phosphor-faint font-mono">{results.length} entries</span>
          </div>
          <button
            onClick={onHome}
            className="text-xs font-mono text-phosphor-dim hover:text-cyan transition-colors duration-150 uppercase"
          >
            [ESC] BACK
          </button>
        </div>

        {results.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border border-terminal-border p-8 text-center"
          >
            <p className="text-sm text-phosphor-dim font-mono">{'>'} NO RECORDS FOUND</p>
            <p className="text-xs text-phosphor-faint font-mono mt-1">Complete a test to populate this log.</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="flex items-center gap-2 px-3 py-1 text-xs font-mono uppercase text-phosphor-faint border-b border-terminal-border">
              <span className="w-24">DATE</span>
              <span className="flex-1">SUBJECT</span>
              <span className="w-14 text-center">TEST</span>
              <span className="w-16 text-right">SCORE</span>
              <span className="w-12 text-center">CAT</span>
              <span className="w-24 text-right">ACTIONS</span>
            </div>

            {results.map((result, i) => {
              const tag = categoryTag(result);
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.15, ease: 'easeOut' as const }}
                  className="flex items-center gap-2 border border-terminal-border px-3 py-2 hover:border-terminal-border-bright transition-colors duration-150"
                >
                  <span className="w-24 text-xs text-phosphor-faint font-mono truncate">
                    {new Date(result.date).toLocaleDateString()}
                  </span>
                  <span className="flex-1 text-xs text-phosphor-dim font-mono truncate">
                    {result.userName}
                  </span>
                  <span className="w-14 text-xs text-cyan-dim font-mono text-center">
                    {result.testType}
                  </span>
                  <span className="w-16 text-xs text-phosphor font-mono text-right tabular-nums">
                    {result.totalScore}/{result.maxScore}
                  </span>
                  <span className={`w-12 text-xs font-mono text-center font-bold ${tag.color}`}>
                    {tag.label}
                  </span>
                  <span className="w-24 flex gap-1 justify-end">
                    <button
                      onClick={() => exportResultPDF(result)}
                      className="text-xs font-mono text-phosphor-dim hover:text-cyan transition-colors duration-150 px-1"
                      title="Export PDF"
                    >
                      PDF
                    </button>
                    <span className="text-phosphor-faint">|</span>
                    <button
                      onClick={() => handleDelete(result.id)}
                      className="text-xs font-mono text-term-red-dim hover:text-term-red transition-colors duration-150 px-1"
                      title="Delete"
                    >
                      DEL
                    </button>
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
