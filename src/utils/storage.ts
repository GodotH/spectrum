import type { TestResult, TestType, Answer } from '../types';

const STORAGE_KEY = 'clinicAutism_results';
const IN_PROGRESS_KEY = 'clinicAutism_inProgress';

export interface InProgressState {
  testType: TestType;
  userName: string;
  answers: Answer[];
  currentIndex: number;
  testQueue: TestType[];
  queueIndex: number;
  totalQuestions: number;
  timestamp: number;
}

export function saveInProgress(state: InProgressState): void {
  localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(state));
}

export function getInProgress(): InProgressState | null {
  try {
    const data = localStorage.getItem(IN_PROGRESS_KEY);
    if (!data) return null;
    const state: InProgressState = JSON.parse(data);
    const age = Date.now() - state.timestamp;
    if (age > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(IN_PROGRESS_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearInProgress(): void {
  localStorage.removeItem(IN_PROGRESS_KEY);
}

export function saveResult(result: TestResult): void {
  const results = getResults();
  results.push(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function getResults(): TestResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function deleteResult(id: string): void {
  const results = getResults().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

export function getResultById(id: string): TestResult | undefined {
  return getResults().find(r => r.id === id);
}
