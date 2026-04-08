import type { Question, Answer, TestType } from '../types';

// --- Per-answer scoring functions ---

// AQ: binary 0/1
function scoreAqAnswer(question: Question, val: number): number {
  if (question.scoringDirection === 'agree') return val <= 2 ? 1 : 0;
  return val >= 3 ? 1 : 0;
}

// CAT-Q: Likert 1-7, reverse items flipped
function scoreCatqAnswer(question: Question, val: number): number {
  return question.scoringDirection === 'disagree' ? 8 - val : val;
}

// RAADS-R: 0-3 scale, reverse items inverted
// Answer values: 1=true now+young, 2=true now only, 3=true young only, 4=never true
// Standard: 1→3, 2→2, 3→1, 4→0. Reverse: 1→0, 2→1, 3→2, 4→3
function scoreRaadsrAnswer(question: Question, val: number): number {
  const raw = 4 - val; // 1→3, 2→2, 3→1, 4→0
  return question.scoringDirection === 'disagree' ? 3 - raw : raw;
}

// SQ-R: 0-2 scale. Forward: strongly agree=2, slightly agree=1, else 0. Reverse: strongly disagree=2, slightly disagree=1, else 0.
function scoreSqAnswer(question: Question, val: number): number {
  if (question.scoringDirection === 'agree') {
    if (val === 1) return 2; // strongly agree
    if (val === 2) return 1; // slightly agree
    return 0;
  }
  if (val === 4) return 2; // strongly disagree
  if (val === 3) return 1; // slightly disagree
  return 0;
}

// EQ: same structure as AQ scoring (binary 0/1 or 0/2 for strong answers)
// Scoring items only (filler items score 0). Forward: agree=score, reverse: disagree=score.
// Strongly = 2, Slightly = 1.
function scoreEqAnswer(question: Question, val: number): number {
  if (question.subscale === 'filler') return 0;
  if (question.scoringDirection === 'agree') {
    if (val === 1) return 2; // strongly agree
    if (val === 2) return 1; // slightly agree
    return 0;
  }
  if (val === 4) return 2; // strongly disagree
  if (val === 3) return 1; // slightly disagree
  return 0;
}

// RBQ-2A: value 1-4, but options 3 and 4 both score 3
function scoreRbq2aAnswer(_question: Question, val: number): number {
  return Math.min(val, 3);
}

function scoreAnswer(question: Question, val: number, testType: TestType): number {
  switch (testType) {
    case 'AQ-50': return scoreAqAnswer(question, val);
    case 'CAT-Q': return scoreCatqAnswer(question, val);
    case 'RAADS-R': return scoreRaadsrAnswer(question, val);
    case 'SQ': return scoreSqAnswer(question, val);
    case 'EQ': return scoreEqAnswer(question, val);
    case 'RBQ-2A': return scoreRbq2aAnswer(question, val);
  }
}

export function calculateTotal(questions: Question[], answers: Answer[], testType: TestType): number {
  return answers.reduce((total, answer) => {
    const question = questions.find(q => q.id === answer.questionId);
    if (!question) return total;
    return total + scoreAnswer(question, answer.value, testType);
  }, 0);
}

export function calculateSubscaleScores(questions: Question[], answers: Answer[], testType: TestType): Record<string, number> {
  const subscaleKeys = new Set(questions.map(q => q.subscale).filter((s): s is string => !!s && s !== 'filler'));
  const scores: Record<string, number> = {};
  for (const subscale of subscaleKeys) {
    const sq = questions.filter(q => q.subscale === subscale);
    const sa = answers.filter(a => sq.some(q => q.id === a.questionId));
    scores[subscale] = calculateTotal(sq, sa, testType);
  }
  return scores;
}

export function getMaxScore(testType: TestType): number {
  switch (testType) {
    case 'AQ-50': return 50;
    case 'CAT-Q': return 175;
    case 'RAADS-R': return 240;
    case 'SQ': return 150;
    case 'EQ': return 80;
    case 'RBQ-2A': return 60;
  }
}

export function getSubscaleMax(testType: TestType): Record<string, number> {
  switch (testType) {
    case 'AQ-50': return { social_skill: 10, attention_switching: 10, attention_to_detail: 10, communication: 10, imagination: 10 };
    case 'CAT-Q': return { compensation: 63, masking: 56, assimilation: 56 };
    case 'RAADS-R': return { language: 21, social_relatedness: 117, sensory_motor: 60, circumscribed_interests: 42 };
    case 'SQ': return {};
    case 'EQ': return {};
    case 'RBQ-2A': return { rmb: 18, rsmb: 18, insistence_sameness: 24 };
  }
}

export function interpretScore(testType: TestType, score: number): string {
  switch (testType) {
    case 'AQ-50':
      if (score >= 32) return 'Score of 32+ indicates clinically significant levels of autistic traits. A specialist diagnostic assessment is recommended.';
      if (score >= 26) return 'Score in the borderline range (26–31). Some autistic traits present. Further assessment may be warranted.';
      return 'Score below 26 suggests autistic traits are not clinically significant based on this screening.';

    case 'CAT-Q':
      if (score >= 124) return `Score of ${score} is in the range typically seen in autistic adults. This indicates a high degree of camouflaging consistent with autistic social masking. A comprehensive diagnostic assessment is recommended.`;
      if (score >= 100) return `Score of ${score} exceeds the general camouflaging threshold of 100. This indicates significant camouflaging behaviour that may warrant further clinical exploration.`;
      if (score >= 91) return `Score of ${score} is in the typical range for neurotypical adults. Some camouflaging behaviours are present but within normal social adaptation.`;
      return `Score of ${score} suggests relatively low levels of social camouflaging.`;

    case 'RAADS-R':
      if (score >= 160) return `Score of ${score} — very strong evidence for autism. Well above the autistic mean of 134.`;
      if (score >= 130) return `Score of ${score} — in the mean autistic score range. Strong evidence for autism.`;
      if (score >= 90) return `Score of ${score} — stronger indications of autism. Above the diagnostic threshold of 65.`;
      if (score >= 65) return `Score of ${score} — at or above the minimum threshold for autism (65+). Indicates likely autism. A formal diagnostic assessment is recommended.`;
      if (score >= 50) return `Score of ${score} — some autistic traits present but below the threshold of 65. Note that some autistic individuals score as low as 44.`;
      if (score >= 25) return `Score of ${score} — some autistic traits but likely not autistic.`;
      return `Score of ${score} — no significant indication of autism.`;

    case 'SQ':
      if (score >= 78) return `Score of ${score} — above the autistic average (~77). Very high systemizing drive, consistent with autistic cognitive profile.`;
      if (score >= 75) return `Score of ${score} — above the autism-indicative threshold (75). High systemizing drive.`;
      if (score >= 56) return `Score of ${score} — in the neurotypical average range (~56). Typical systemizing drive.`;
      return `Score of ${score} — below average systemizing drive.`;

    case 'EQ':
      if (score <= 15) return `Score of ${score} — very low empathy. Consistent with scores typically seen in autistic individuals.`;
      if (score <= 30) return `Score of ${score} — below average empathy. In the range where further assessment may be warranted.`;
      if (score <= 52) return `Score of ${score} — average empathy range.`;
      return `Score of ${score} — above average empathy.`;

    case 'RBQ-2A':
      if (score >= 36) return `Score of ${score} — at or above the average autistic score (36). Significant restricted and repetitive behaviours present.`;
      if (score >= 26) return `Score of ${score} — above the threshold of 26. Elevated restricted and repetitive behaviours.`;
      return `Score of ${score} — in the non-autistic range (average 25). Restricted and repetitive behaviours not significantly elevated.`;
  }
}

export interface NormReference {
  label: string;
  value: number;
  color: 'green' | 'amber' | 'red';
}

export interface NormData {
  references: NormReference[];
  max: number;
  inverse: boolean; // true = lower score is more autistic (EQ)
}

export function getNormReferences(testType: TestType): NormData {
  switch (testType) {
    case 'AQ-50':
      return {
        references: [
          { label: 'NT typical', value: 16, color: 'green' },
          { label: 'Borderline', value: 26, color: 'amber' },
          { label: 'Autistic threshold', value: 32, color: 'red' },
        ],
        max: 50,
        inverse: false,
      };
    case 'CAT-Q':
      return {
        references: [
          { label: 'NT mean', value: 91, color: 'green' },
          { label: 'Threshold', value: 100, color: 'amber' },
          { label: 'Autistic mean', value: 124, color: 'red' },
        ],
        max: 175,
        inverse: false,
      };
    case 'RAADS-R':
      return {
        references: [
          { label: 'NT mean', value: 26, color: 'green' },
          { label: 'Threshold', value: 65, color: 'amber' },
          { label: 'Autistic mean', value: 134, color: 'red' },
        ],
        max: 240,
        inverse: false,
      };
    case 'EQ':
      return {
        references: [
          { label: 'Autistic mean', value: 20, color: 'red' },
          { label: 'Threshold', value: 30, color: 'amber' },
          { label: 'NT male mean', value: 42, color: 'green' },
          { label: 'NT female mean', value: 47, color: 'green' },
        ],
        max: 80,
        inverse: true,
      };
    case 'SQ':
      return {
        references: [
          { label: 'NT mean', value: 56, color: 'green' },
          { label: 'Threshold', value: 75, color: 'amber' },
          { label: 'Autistic mean', value: 77, color: 'red' },
        ],
        max: 150,
        inverse: false,
      };
    case 'RBQ-2A':
      return {
        references: [
          { label: 'NT mean', value: 25, color: 'green' },
          { label: 'Threshold', value: 26, color: 'amber' },
          { label: 'Autistic mean', value: 36, color: 'red' },
        ],
        max: 60,
        inverse: false,
      };
  }
}

export function getScoreCategory(testType: TestType, score: number): 'low' | 'borderline' | 'high' {
  switch (testType) {
    case 'AQ-50':
      if (score >= 32) return 'high';
      if (score >= 26) return 'borderline';
      return 'low';
    case 'CAT-Q':
      if (score >= 124) return 'high';
      if (score >= 100) return 'borderline';
      return 'low';
    case 'RAADS-R':
      if (score >= 65) return 'high';
      if (score >= 50) return 'borderline';
      return 'low';
    case 'SQ':
      if (score >= 75) return 'high';
      if (score >= 56) return 'borderline';
      return 'low';
    case 'EQ':
      if (score <= 15) return 'high'; // EQ is inverse — low score = autistic indicator
      if (score <= 30) return 'borderline';
      return 'low';
    case 'RBQ-2A':
      if (score >= 36) return 'high';
      if (score >= 26) return 'borderline';
      return 'low';
  }
}
