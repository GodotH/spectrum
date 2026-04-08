import type { Question } from '../types';

// RBQ-2A (Adult Repetitive Behaviours Questionnaire-2) — Barrett et al. (2015)
// 20 items, 3 subscales. Scoring: 1-3 per item (options C and D both = 3).
// Subscales: rmb (Q1-6), rsmb (Q7-12), insistence_sameness (Q13-20)
// Total range: 20-60. Threshold: 26+.

export const RBQ2A_QUESTIONS: Question[] = [
  // RMB subscale (Q1-6)
  { id: 1,  text: "Do you like to arrange items in rows or patterns?", scoringDirection: 'agree', subscale: 'rmb' },
  { id: 2,  text: "Do you repetitively fiddle with items? (e.g. spin, twiddle, bang, tap, twist, or flick anything repeatedly?)", scoringDirection: 'agree', subscale: 'rmb' },
  { id: 3,  text: "Do you like to spin yourself around and around?", scoringDirection: 'agree', subscale: 'rmb' },
  { id: 4,  text: "Do you rock backwards and forwards, or side to side, either when sitting or when standing?", scoringDirection: 'agree', subscale: 'rmb' },
  { id: 5,  text: "Do you pace or move around repetitively (e.g. walk to and fro across a room, or around the same path in the garden?)", scoringDirection: 'agree', subscale: 'rmb' },
  { id: 6,  text: "Do you make repetitive hand and/or finger movements? (e.g. flap, wave, or flick your hands or fingers repetitively?)", scoringDirection: 'agree', subscale: 'rmb' },
  // RSMB subscale (Q7-12)
  { id: 7,  text: "Do you have a fascination with specific objects (e.g. trains, road signs, or other things?)", scoringDirection: 'agree', subscale: 'rsmb' },
  { id: 8,  text: "Do you like to look at objects from particular or unusual angles?", scoringDirection: 'agree', subscale: 'rsmb' },
  { id: 9,  text: "Do you have a special interest in the smell of people or objects?", scoringDirection: 'agree', subscale: 'rsmb' },
  { id: 10, text: "Do you have a special interest in the feel of different surfaces?", scoringDirection: 'agree', subscale: 'rsmb' },
  { id: 11, text: "Do you have any special objects you like to carry around?", scoringDirection: 'agree', subscale: 'rsmb' },
  { id: 12, text: "Do you collect or hoard items of any sort?", scoringDirection: 'agree', subscale: 'rsmb' },
  // Insistence on Sameness subscale (Q13-20)
  { id: 13, text: "Do you insist on things at home remaining the same? (e.g. furniture staying in the same place, things being kept in certain places, or arranged in certain ways?)", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 14, text: "Do you get upset about minor changes to objects (e.g. flecks of dirt on your clothes, minor scratches on objects?)", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 15, text: "Do you insist that aspects of daily routine must remain the same?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 16, text: "Do you insist on doing things in a certain way or re-doing things until they are 'just right'?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 17, text: "Do you play the same music, game or video, or read the same book repeatedly?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 18, text: "Do you insist on wearing the same clothes or refuse to wear new clothes?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 19, text: "Do you insist on eating the same foods, or a very small range of foods, at every meal?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
  { id: 20, text: "If you are left to occupy yourself, will you choose from a restricted range of repetitive activities?", scoringDirection: 'agree', subscale: 'insistence_sameness' },
];

// RBQ-2A has variable answer options per question group
// Q1-6: 4 options (frequency-based), Q7-12: 3 options, Q13-16: 4 options (impact), Q17-19: 4 options (resistance), Q20: 3 options (unique)
// Options C and D both score 3 on 4-option questions.

export interface RBQ2AAnswerSet {
  questionRange: [number, number];
  options: { value: number; label: string }[];
}

// Values must be unique per option for UI selection. Scoring caps at 3.
export const RBQ2A_ANSWER_SETS: RBQ2AAnswerSet[] = [
  {
    questionRange: [1, 6],
    options: [
      { value: 1, label: 'Never or rarely' },
      { value: 2, label: 'One or more times daily' },
      { value: 3, label: '15 or more times daily' },
      { value: 4, label: '30 or more times daily' },
    ],
  },
  {
    questionRange: [7, 12],
    options: [
      { value: 1, label: 'Never or rarely' },
      { value: 2, label: 'Mild or occasional' },
      { value: 3, label: 'Marked or notable' },
    ],
  },
  {
    questionRange: [13, 16],
    options: [
      { value: 1, label: 'Never or rarely' },
      { value: 2, label: 'Mild — does not affect others' },
      { value: 3, label: 'Notable — occasionally affects others' },
      { value: 4, label: 'Severe — affects others regularly' },
    ],
  },
  {
    questionRange: [17, 19],
    options: [
      { value: 1, label: 'Never or rarely' },
      { value: 2, label: 'Mild — not entirely resistant to change' },
      { value: 3, label: 'Notable — will tolerate changes when necessary' },
      { value: 4, label: 'Severe — will not tolerate any changes' },
    ],
  },
  {
    questionRange: [20, 20],
    options: [
      { value: 1, label: 'A range of varied and flexible activities' },
      { value: 2, label: 'Some varied interests but commonly choose the same' },
      { value: 3, label: 'Almost always choose from a restricted range' },
    ],
  },
];

export function getRBQ2AOptionsForQuestion(questionId: number) {
  const set = RBQ2A_ANSWER_SETS.find(s => questionId >= s.questionRange[0] && questionId <= s.questionRange[1]);
  return set ? set.options : RBQ2A_ANSWER_SETS[0].options;
}
