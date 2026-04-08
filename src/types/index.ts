export type TestType = 'AQ-50' | 'CAT-Q' | 'RAADS-R' | 'EQ' | 'SQ' | 'RBQ-2A';

export const TEST_MENU: { type: TestType; label: string; desc: string; tooltip: string }[] = [
  { type: 'AQ-50',   label: 'AQ-50',   desc: 'Autism Quotient — 50 Qs',      tooltip: 'Autism Spectrum Quotient (Baron-Cohen, 2001). The most widely used autism screening tool. Covers 5 domains: social skills, attention switching, attention to detail, communication, and imagination. Score ≥32 suggests clinically significant autistic traits. ~10 min.' },
  { type: 'CAT-Q',   label: 'CAT-Q',   desc: 'Camouflaging — 25 Qs',         tooltip: 'Camouflaging Autistic Traits Questionnaire (Hull, 2019). Detects social masking — the effort spent hiding autistic traits to appear neurotypical. Critical for late-diagnosed adults, especially women, who often "pass" on other screening tools. 3 subscales: Compensation, Masking, Assimilation. ~5 min.' },
  { type: 'RAADS-R', label: 'RAADS-R', desc: 'Diagnostic Scale — 80 Qs',     tooltip: 'Ritvo Autism Asperger Diagnostic Scale-Revised (Ritvo, 2011). The most comprehensive self-report autism instrument. 97% sensitivity, 100% specificity in research. Covers language, social relatedness, sensory-motor, and circumscribed interests. Unique lifetime perspective (now vs. childhood). ~15 min.' },
  { type: 'EQ',      label: 'EQ',      desc: 'Empathy Quotient — 60 Qs',     tooltip: 'Empathy Quotient (Baron-Cohen & Wheelwright, 2004). Measures cognitive empathy (understanding others\' feelings) and emotional reactivity. 81% of autistic adults score ≤30. Includes 20 filler items. Part of the EQ-SQ brain type framework. ~10 min.' },
  { type: 'SQ',      label: 'SQ',      desc: 'Systemizing Quotient — 75 Qs', tooltip: 'Systemizing Quotient-Revised (Wheelwright, 2006). Measures the drive to analyze rules, patterns, and systems. Higher scores correlate with autistic cognitive style. Companion to EQ — together they map the empathizing-systemizing spectrum. Best used alongside EQ for the full picture. ~10 min.' },
  { type: 'RBQ-2A',  label: 'RBQ-2A',  desc: 'Repetitive Behaviours — 20 Qs', tooltip: 'Repetitive Behaviour Questionnaire for Adults (Barrett, 2015). Assesses restricted and repetitive behaviours — a core autism diagnostic criterion often missed by other screening tools. 3 subscales: motor behaviours (stimming), sensory interests, and insistence on sameness. Quick — ~3 min.' },
];

export interface AnswerOption {
  value: number;
  label: string;
  key: string;
}

export interface Question {
  id: number;
  text: string;
  scoringDirection: 'agree' | 'disagree';
  subscale?: string;
}

export interface Answer {
  questionId: number;
  value: number;
}

export interface TestResult {
  id: string;
  testType: TestType;
  userName: string;
  date: string;
  answers: Answer[];
  totalScore: number;
  maxScore: number;
  subscaleScores?: Record<string, number>;
  interpretation: string;
}

// --- Answer options per test type ---

export const AQ_ANSWER_OPTIONS: AnswerOption[] = [
  { value: 1, label: 'Definitely Agree', key: '1' },
  { value: 2, label: 'Slightly Agree', key: '2' },
  { value: 3, label: 'Slightly Disagree', key: '3' },
  { value: 4, label: 'Definitely Disagree', key: '4' },
];

export const CATQ_ANSWER_OPTIONS: AnswerOption[] = [
  { value: 1, label: 'Strongly Disagree', key: '1' },
  { value: 2, label: 'Disagree', key: '2' },
  { value: 3, label: 'Somewhat Disagree', key: '3' },
  { value: 4, label: 'Neither Agree nor Disagree', key: '4' },
  { value: 5, label: 'Somewhat Agree', key: '5' },
  { value: 6, label: 'Agree', key: '6' },
  { value: 7, label: 'Strongly Agree', key: '7' },
];

export const RAADSR_ANSWER_OPTIONS: AnswerOption[] = [
  { value: 1, label: 'True always', key: '1' },
  { value: 2, label: 'True only now', key: '2' },
  { value: 3, label: 'True only when I was younger than 16', key: '3' },
  { value: 4, label: 'Never true', key: '4' },
];

// SQ and EQ use same 4-point agree/disagree as AQ
export const SQ_ANSWER_OPTIONS = AQ_ANSWER_OPTIONS;
export const EQ_ANSWER_OPTIONS = AQ_ANSWER_OPTIONS;

// RBQ-2A has variable options per question — default set for the menu
export const RBQ2A_ANSWER_OPTIONS: AnswerOption[] = [
  { value: 1, label: 'Never or rarely', key: '1' },
  { value: 2, label: 'Mild or occasional', key: '2' },
  { value: 3, label: 'Marked or notable', key: '3' },
];

export function getAnswerOptions(testType: TestType): AnswerOption[] {
  switch (testType) {
    case 'CAT-Q': return CATQ_ANSWER_OPTIONS;
    case 'RAADS-R': return RAADSR_ANSWER_OPTIONS;
    case 'SQ': return SQ_ANSWER_OPTIONS;
    case 'EQ': return EQ_ANSWER_OPTIONS;
    case 'RBQ-2A': return RBQ2A_ANSWER_OPTIONS;
    default: return AQ_ANSWER_OPTIONS;
  }
}

// --- Subscale labels per test type ---

const SUBSCALE_LABELS: Record<string, Record<string, string>> = {
  'AQ-50': {
    social_skill: 'Social Skill',
    attention_switching: 'Attention Switching',
    attention_to_detail: 'Attention to Detail',
    communication: 'Communication',
    imagination: 'Imagination',
  },
  'CAT-Q': {
    compensation: 'Compensation',
    masking: 'Masking',
    assimilation: 'Assimilation',
  },
  'RAADS-R': {
    language: 'Language',
    social_relatedness: 'Social Relatedness',
    sensory_motor: 'Sensory-Motor',
    circumscribed_interests: 'Circumscribed Interests',
  },
  'SQ': {},
  'EQ': {},
  'RBQ-2A': {
    rmb: 'Repetitive Motor',
    rsmb: 'Repetitive Sensory-Motor',
    insistence_sameness: 'Insistence on Sameness',
  },
};

export function getSubscaleLabels(testType: TestType): Record<string, string> {
  return SUBSCALE_LABELS[testType] || {};
}

export type AppScreen = 'welcome' | 'questionnaire' | 'results' | 'history';
