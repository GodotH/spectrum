import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AnswerOption, Question } from '../types';

interface Props {
  testType: string;
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  progress: number;
  currentAnswer: number | undefined;
  answerOptions: AnswerOption[];
  answeredCount: number;
  answeredIds: Set<number>;
  allAnswered: boolean;
  isLastQuestion: boolean;
  onAnswer: (value: number) => void;
  onBack: () => void;
  onForward: () => void;
  onGoToQuestion: (index: number) => void;
  onFinish: () => void;
  onQuit: () => void;
}

function AsciiProgressBar({ progress }: { progress: number }) {
  const barWidth = 16;
  const filled = Math.round((progress / 100) * barWidth);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(barWidth - filled);
  const pct = Math.round(progress);
  return (
    <>
      {/* Full bar — hidden on mobile */}
      <div className="hidden sm:flex font-mono text-xs text-phosphor-dim ascii-bar items-center">
        <span className="text-phosphor-faint">[</span>
        <span className="text-phosphor text-glow-green">{bar.slice(0, filled)}</span>
        <span className="text-phosphor-faint">{bar.slice(filled)}</span>
        <span className="text-phosphor-faint">]</span>
        <span className="text-phosphor-dim ml-1">{pct}%</span>
      </div>
      {/* Compact percentage — mobile only */}
      <div className="flex sm:hidden font-mono text-xs text-phosphor-dim">
        <span>{pct}%</span>
      </div>
    </>
  );
}

function OptionButton({ option, selected, onSelect, size = 'md' }: {
  option: AnswerOption; selected: boolean; onSelect: (v: number) => void; size?: 'sm' | 'md';
}) {
  const textClass = size === 'sm' ? 'text-[11px] sm:text-[11px] leading-tight' : 'text-sm sm:text-xs leading-snug';
  return (
    <button
      onClick={() => onSelect(option.value)}
      className={`group border px-3 py-3.5 sm:py-3 text-left transition-all duration-150 font-mono min-h-[52px] sm:min-h-0 ${
        selected
          ? 'border-phosphor bg-phosphor-faint border-glow-green'
          : 'border-terminal-border hover:border-terminal-border-bright hover:bg-terminal-bg-light'
      }`}
    >
      <span className={`text-[10px] block mb-1 ${
        selected ? 'text-amber text-glow-amber' : 'text-amber'
      }`}>
        [{option.key}]
      </span>
      <span className={`${textClass} block ${
        selected ? 'text-phosphor text-glow-green' : 'text-phosphor group-hover:text-phosphor'
      }`}>
        {option.label}
      </span>
    </button>
  );
}

function ReviewGrid({ totalQuestions, answeredCount, answeredIds, allAnswered, onGoToQuestion, onSubmit, onBack }: {
  totalQuestions: number;
  answeredCount: number;
  answeredIds: Set<number>;
  allAnswered: boolean;
  onGoToQuestion: (index: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const missing = Array.from({ length: totalQuestions }, (_, i) => i + 1).filter(q => !answeredIds.has(q));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
      else if (e.key === 'Enter' && allAnswered) onSubmit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBack, onSubmit, allAnswered]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-terminal-bg/95">
      <div className="border border-phosphor bg-terminal-bg p-6 max-w-[480px] w-full mx-4 border-glow-green font-mono">
        {allAnswered ? (
          <>
            <div className="text-sm text-phosphor text-glow-green uppercase tracking-wider mb-2">
              {'>'} ALL {totalQuestions} QUESTIONS ANSWERED
            </div>
            <div className="text-xs text-phosphor-dim mb-6">
              {'>'} Ready to compile results.
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-amber text-glow-amber uppercase tracking-wider mb-2">
              {'>'} {missing.length} UNANSWERED QUESTION{missing.length > 1 ? 'S' : ''}
            </div>
            <div className="text-xs text-phosphor-dim mb-3">
              {'>'} {answeredCount}/{totalQuestions} complete. Jump to missing:
            </div>
            <div className="flex flex-wrap gap-2 mb-6">
              {missing.map(qNum => (
                <button
                  key={qNum}
                  onClick={() => onGoToQuestion(qNum - 1)}
                  className="border border-term-red/50 bg-term-red/10 px-3 py-1.5 text-xs text-term-red hover:bg-term-red/20 hover:border-term-red/70 transition-all"
                >
                  Q{qNum}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onBack}
            className="border border-terminal-border px-5 py-2 text-xs uppercase text-phosphor-dim hover:text-phosphor hover:border-terminal-border-bright transition-all"
          >
            [ESC] BACK
          </button>
          <button
            onClick={onSubmit}
            disabled={!allAnswered}
            className={`border px-5 py-2 text-xs uppercase tracking-wider transition-all ${
              allAnswered
                ? 'border-phosphor bg-phosphor-faint text-phosphor text-glow-green hover:bg-phosphor/20 border-glow-green'
                : 'border-terminal-border text-phosphor-faint cursor-not-allowed'
            }`}
          >
            {'>'} SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionScreen({
  testType, question, currentIndex, totalQuestions, progress, currentAnswer,
  answerOptions, answeredCount, answeredIds, allAnswered, isLastQuestion,
  onAnswer, onBack, onForward, onGoToQuestion, onFinish, onQuit,
}: Props) {

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const maxKey = answerOptions.length;
  const is7point = maxKey === 7;
  const is3option = maxKey === 3;
  const hasLongLabels = answerOptions.some(o => o.label.length > 25);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (showReview) return; // ReviewGrid handles its own keys

    const num = parseInt(e.key);
    if (num >= 1 && num <= maxKey) {
      const option = answerOptions[num - 1];
      if (option) onAnswer(option.value);
    } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      onBack();
    } else if (e.key === 'ArrowRight') {
      if (currentAnswer !== undefined) onForward();
    } else if (e.key === 'Enter' && isLastQuestion && allAnswered) {
      setShowReview(true);
    } else if (e.key === 'Escape') {
      setShowQuitConfirm(prev => !prev);
    } else if (showQuitConfirm && e.key.toLowerCase() === 'y') {
      onQuit();
    } else if (showQuitConfirm && e.key.toLowerCase() === 'n') {
      setShowQuitConfirm(false);
    }
  }, [onAnswer, onBack, onForward, onQuit, currentAnswer, isLastQuestion, allAnswered, answerOptions, maxKey, showQuitConfirm, showReview]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleReviewGoTo = useCallback((index: number) => {
    setShowReview(false);
    onGoToQuestion(index);
  }, [onGoToQuestion]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:p-6">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 border-b border-terminal-border bg-terminal-bg/95 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between z-50 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="text-sm text-phosphor font-mono uppercase tracking-widest text-glow-green shrink-0">
            SPECTRUM v1.0
          </span>
          <span className="text-phosphor-faint hidden sm:inline">│</span>
          <span className="text-xs text-amber font-mono uppercase tracking-wider hidden sm:inline shrink-0">
            {testType}
          </span>
          <span className="text-xs text-phosphor-dim font-mono uppercase shrink-0">
            Q.{String(currentIndex + 1).padStart(2, '0')}/{totalQuestions}
          </span>
          <AsciiProgressBar progress={progress} />
        </div>
        <button
          onClick={() => setShowQuitConfirm(true)}
          className="text-xs text-phosphor hover:text-phosphor transition-colors duration-150 font-mono uppercase shrink-0 min-h-[36px] px-2 flex items-center"
        >
          <span className="hidden sm:inline">[ESC] </span>END
        </button>
      </div>

      {/* Quit confirmation overlay */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-terminal-bg/90 px-4">
          <div className="border border-phosphor p-6 bg-terminal-bg w-full max-w-sm text-center space-y-4 border-glow-green">
            <div className="text-sm text-phosphor font-mono uppercase">{'>'} END TEST?</div>
            <p className="text-xs text-phosphor font-mono">Progress will be lost. {answeredCount}/{totalQuestions} answered.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onQuit}
                className="border border-term-red px-5 py-3 sm:py-2 text-xs font-mono uppercase text-term-red hover:bg-term-red/20 transition-all min-h-[44px]"
              >
                [Y] YES, END
              </button>
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="border border-phosphor px-5 py-3 sm:py-2 text-xs font-mono uppercase text-phosphor hover:bg-phosphor/10 transition-all min-h-[44px]"
              >
                [N] CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review overlay */}
      {showReview && (
        <ReviewGrid
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          answeredIds={answeredIds}
          allAnswered={allAnswered}
          onGoToQuestion={handleReviewGoTo}
          onSubmit={onFinish}
          onBack={() => setShowReview(false)}
        />
      )}

      {/* Question area — pt accounts for fixed top bar (~44px mobile, ~52px desktop) */}
      <div className={`w-full mt-[44px] sm:mt-[52px] ${is7point ? 'max-w-[640px]' : hasLongLabels ? 'max-w-[620px]' : 'max-w-[560px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
          >
            {/* Question */}
            <div className="mb-5 border border-terminal-border p-4 sm:p-5">
              <span className="text-xs font-mono uppercase tracking-wider text-amber text-glow-amber">
                QUERY #{String(question.id).padStart(2, '0')}
              </span>
              <h2 className="mt-3 text-[15px] sm:text-base leading-relaxed text-phosphor text-glow-green">
                {question.text}
              </h2>
            </div>

            {/* Answer options — adaptive layout */}
            {is7point ? (
              /* 7-point Likert: 2-col on mobile, 4+3 on sm+ */
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {answerOptions.slice(0, 4).map((option) => (
                    <OptionButton key={option.key} option={option} selected={currentAnswer === option.value} onSelect={onAnswer} size="sm" />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 sm:mx-auto" style={{ maxWidth: undefined }}>
                  {answerOptions.slice(4).map((option) => (
                    <OptionButton key={option.key} option={option} selected={currentAnswer === option.value} onSelect={onAnswer} size="sm" />
                  ))}
                </div>
              </div>
            ) : is3option ? (
              /* 3-option: always 3 cols — wide enough on mobile */
              <div className="grid grid-cols-3 gap-2">
                {answerOptions.map((option) => (
                  <OptionButton key={option.key} option={option} selected={currentAnswer === option.value} onSelect={onAnswer} size={hasLongLabels ? 'sm' : 'md'} />
                ))}
              </div>
            ) : (
              /* 4-option: 1-col on mobile, 2x2 on sm+ */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {answerOptions.map((option) => (
                  <OptionButton key={option.key} option={option} selected={currentAnswer === option.value} onSelect={onAnswer} size={hasLongLabels ? 'sm' : 'md'} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between border-t border-terminal-border pt-4">
          <button
            onClick={onBack}
            disabled={currentIndex === 0}
            className="text-sm sm:text-xs font-mono text-phosphor hover:text-phosphor disabled:opacity-20 transition-colors duration-150 uppercase min-h-[44px] flex items-center px-1"
          >
            {'<'} BACK
          </button>

          {isLastQuestion && allAnswered ? (
            <button
              onClick={() => setShowReview(true)}
              className="border border-phosphor bg-phosphor-faint px-4 sm:px-5 py-2.5 sm:py-2 text-xs font-mono uppercase tracking-wider text-phosphor text-glow-green transition-all duration-150 hover:bg-phosphor/20 border-glow-green min-h-[44px]"
            >
              {'>'} COMPILE RESULTS
            </button>
          ) : (
            <button
              onClick={onForward}
              disabled={currentAnswer === undefined}
              className="text-sm sm:text-xs font-mono text-phosphor hover:text-phosphor disabled:opacity-20 transition-colors duration-150 uppercase min-h-[44px] flex items-center px-1"
            >
              NEXT {'>'}
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-phosphor-dim font-mono hidden sm:block">
          [1-{maxKey}] answer &middot; [&larr;&rarr;] navigate &middot; [ENTER] submit
        </p>
      </div>
    </div>
  );
}
