import { useState, useCallback, useRef } from 'react';
import type { Answer, AnswerOption, Question, TestResult, TestType, AppScreen } from '../types';
import { getAnswerOptions } from '../types';
import { getRBQ2AOptionsForQuestion } from '../data/rbq2a';
import { AQ50_QUESTIONS } from '../data/aq50';
import { CATQ_QUESTIONS } from '../data/catq';
import { RAADSR_QUESTIONS } from '../data/raadsr';
import { SQ_QUESTIONS } from '../data/sq';
import { EQ_QUESTIONS } from '../data/eq';
import { RBQ2A_QUESTIONS } from '../data/rbq2a';
import { calculateTotal, calculateSubscaleScores, interpretScore, getMaxScore } from '../utils/scoring';
import { saveResult, saveInProgress, clearInProgress } from '../utils/storage';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getQuestions(testType: TestType): Question[] {
  switch (testType) {
    case 'AQ-50': return AQ50_QUESTIONS;
    case 'CAT-Q': return CATQ_QUESTIONS;
    case 'RAADS-R': return RAADSR_QUESTIONS;
    case 'SQ': return SQ_QUESTIONS;
    case 'EQ': return EQ_QUESTIONS;
    case 'RBQ-2A': return RBQ2A_QUESTIONS;
  }
}

export function useQuestionnaire() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [testType, setTestType] = useState<TestType>('AQ-50');
  const [userName, setUserName] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testQueue, setTestQueue] = useState<TestType[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [batteryResults, setBatteryResults] = useState<TestResult[]>([]);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const questions = getQuestions(testType);
  const currentQuestion = questions[currentIndex];

  // RBQ-2A has per-question variable answer options
  const answerOptions: AnswerOption[] = (testType === 'RBQ-2A' && currentQuestion)
    ? getRBQ2AOptionsForQuestion(currentQuestion.id).map((o, i) => ({ ...o, key: String(i + 1) }))
    : getAnswerOptions(testType);
  const totalQuestions = questions.length;
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id)?.value;
  const progress = totalQuestions > 0 ? ((currentIndex + (currentAnswer !== undefined ? 1 : 0)) / totalQuestions) * 100 : 0;

  const startTest = useCallback((name: string, types: TestType[]) => {
    setUserName(name);
    setTestQueue(types);
    setQueueIndex(0);
    setBatteryResults([]);
    setTestType(types[0]);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
    setScreen('questionnaire');
  }, []);

  const resumeTest = useCallback((state: {
    testType: TestType; userName: string; answers: Answer[]; currentIndex: number;
    testQueue: TestType[]; queueIndex: number;
  }) => {
    setUserName(state.userName);
    setTestQueue(state.testQueue);
    setQueueIndex(state.queueIndex);
    setBatteryResults([]);
    setTestType(state.testType);
    setCurrentIndex(state.currentIndex);
    setAnswers(state.answers);
    setResult(null);
    setScreen('questionnaire');
  }, []);

  const answerQuestion = useCallback((value: number) => {
    const questionId = questions[currentIndex].id;
    const nextIndex = Math.min(currentIndex + 1, totalQuestions - 1);
    setAnswers(prev => {
      const updated = [...prev.filter(a => a.questionId !== questionId), { questionId, value }];
      saveInProgress({
        testType, userName, answers: updated, currentIndex: nextIndex, testQueue, queueIndex, totalQuestions, timestamp: Date.now(),
      });
      return updated;
    });

    // Clear any pending auto-advance timeout to prevent double-advance
    if (advanceTimeoutRef.current !== null) {
      clearTimeout(advanceTimeoutRef.current);
    }

    // Auto-advance after short delay
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(i => i + 1);
      }
    }, 300);
  }, [currentIndex, questions, totalQuestions, testType, userName, testQueue, queueIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }, [currentIndex]);

  const goForward = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentIndex(index);
    }
  }, [totalQuestions]);

  const advanceQueue = useCallback(() => {
    const nextIdx = queueIndex + 1;
    if (nextIdx < testQueue.length) {
      setQueueIndex(nextIdx);
      setTestType(testQueue[nextIdx]);
      setCurrentIndex(0);
      setAnswers([]);
      setResult(null);
      setScreen('questionnaire');
      saveInProgress({
        testType: testQueue[nextIdx], userName, answers: [], currentIndex: 0, testQueue, queueIndex: nextIdx,
        totalQuestions: getQuestions(testQueue[nextIdx]).length, timestamp: Date.now(),
      });
    }
  }, [queueIndex, testQueue, userName]);

  const finishTest = useCallback(() => {
    const totalScore = calculateTotal(questions, answers, testType);
    const maxScore = getMaxScore(testType);
    const subscaleScores = calculateSubscaleScores(questions, answers, testType);
    const interpretation = interpretScore(testType, totalScore);

    const testResult: TestResult = {
      id: generateId(),
      testType,
      userName,
      date: new Date().toISOString(),
      answers: [...answers],
      totalScore,
      maxScore,
      subscaleScores,
      interpretation,
    };

    saveResult(testResult);
    clearInProgress();
    setResult(testResult);
    setBatteryResults(prev => [...prev, testResult]);
    setScreen('results');
  }, [questions, answers, testType, userName]);

  const goHome = useCallback(() => {
    clearInProgress();
    setScreen('welcome');
    setResult(null);
    setCurrentIndex(0);
    setAnswers([]);
  }, []);

  const allAnswered = answers.length === totalQuestions;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const isBattery = testQueue.length > 1;
  const hasNextInQueue = queueIndex < testQueue.length - 1;
  const nextTestType = hasNextInQueue ? testQueue[queueIndex + 1] : null;

  return {
    screen, setScreen,
    testType, userName,
    currentIndex, currentQuestion, totalQuestions,
    progress, currentAnswer, answers, answerOptions,
    result,
    allAnswered, isLastQuestion,
    testQueue, queueIndex, isBattery, hasNextInQueue, nextTestType, batteryResults,
    startTest, resumeTest, answerQuestion, goBack, goForward, goToQuestion, finishTest, goHome, advanceQueue,
  };
}
