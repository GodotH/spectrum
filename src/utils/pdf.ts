import jsPDF from 'jspdf';
import type { TestResult, Question } from '../types';
import { getAnswerOptions, getSubscaleLabels } from '../types';
import { AQ50_QUESTIONS } from '../data/aq50';
import { CATQ_QUESTIONS } from '../data/catq';
import { RAADSR_QUESTIONS } from '../data/raadsr';
import { SQ_QUESTIONS } from '../data/sq';
import { RBQ2A_QUESTIONS, getRBQ2AOptionsForQuestion } from '../data/rbq2a';
import { EQ_QUESTIONS } from '../data/eq';
import { getScoreCategory, getSubscaleMax } from './scoring';

export function exportResultPDF(result: TestResult): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const questionMap: Record<string, Question[]> = {
    'AQ-50': AQ50_QUESTIONS,
    'CAT-Q': CATQ_QUESTIONS,
    'RAADS-R': RAADSR_QUESTIONS,
    'SQ': SQ_QUESTIONS,
    'EQ': EQ_QUESTIONS,
    'RBQ-2A': RBQ2A_QUESTIONS,
  };
  const questions = questionMap[result.testType] || [];

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titles: Record<string, string> = {
    'AQ-50': 'Autism Spectrum Quotient (AQ-50)',
    'CAT-Q': 'Camouflaging Autistic Traits Questionnaire (CAT-Q)',
    'RAADS-R': 'Ritvo Autism Asperger Diagnostic Scale-Revised (RAADS-R)',
    'EQ': 'Empathy Quotient (EQ)',
    'SQ': 'Systemizing Quotient-Revised (SQ-R)',
    'RBQ-2A': 'Repetitive Behaviours Questionnaire (RBQ-2A)',
  };
  const title = titles[result.testType] || result.testType;
  doc.text(title, margin, y, { maxWidth: contentWidth });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const subtitle = 'Screening Questionnaire — Results Report';
  doc.text(subtitle, margin, y);
  y += 10;

  // Divider
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Patient info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(result.userName, margin + 18, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin + 90, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(result.date).toLocaleDateString('en-CA'), margin + 104, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Test:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(result.testType, margin + 18, y);
  y += 10;

  // Score summary box
  const category = getScoreCategory(result.testType, result.totalScore);
  const boxColor: [number, number, number] =
    category === 'high' ? [220, 53, 69] :
    category === 'borderline' ? [255, 193, 7] :
    [40, 167, 69];

  doc.setFillColor(...boxColor);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Score: ${result.totalScore} / ${result.maxScore}`, margin + 6, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(result.interpretation, margin + 6, y + 15, { maxWidth: contentWidth - 12 });
  doc.setTextColor(0, 0, 0);
  y += 28;

  // Subscale scores
  if (result.subscaleScores) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Subscale Scores', margin, y);
    y += 6;

    const labels = getSubscaleLabels(result.testType);
    const maxScores = getSubscaleMax(result.testType);

    for (const subscale of Object.keys(result.subscaleScores)) {
      const score = result.subscaleScores[subscale];
      const maxVal = maxScores[subscale] || 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${labels[subscale] || subscale}:`, margin + 4, y);
      doc.setFont('helvetica', 'bold');
      doc.text(`${score} / ${maxVal}`, margin + 55, y);

      // Mini bar
      doc.setFillColor(220, 220, 220);
      doc.rect(margin + 72, y - 3, 60, 4, 'F');
      doc.setFillColor(...boxColor);
      doc.rect(margin + 72, y - 3, 60 * (score / maxVal), 4, 'F');

      y += 6;
    }
    y += 6;
  }

  // Questions & Answers table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Responses', margin, y);
  y += 6;

  const isRBQ2A = result.testType === 'RBQ-2A';
  const genericAnswerOptions = getAnswerOptions(result.testType);
  const genericLabels: Record<number, string> = {};
  for (const opt of genericAnswerOptions) {
    genericLabels[opt.value] = opt.label;
  }

  doc.setFontSize(8);
  for (const question of questions) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const answer = result.answers.find(a => a.questionId === question.id);
    let answerText = '—';
    if (answer) {
      if (isRBQ2A) {
        const qOpts = getRBQ2AOptionsForQuestion(question.id);
        const match = qOpts.find(o => o.value === answer.value);
        answerText = match ? match.label : String(answer.value);
      } else {
        answerText = genericLabels[answer.value] || String(answer.value);
      }
    }

    // Alternating row bg
    if (question.id % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 3.5, contentWidth, 5, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${question.id}.`, margin, y);
    doc.setFont('helvetica', 'normal');

    const textLines = doc.splitTextToSize(question.text, contentWidth - 55);
    doc.text(textLines, margin + 8, y);
    doc.setFont('helvetica', 'bold');
    doc.text(answerText, pageWidth - margin - 35, y);

    y += Math.max(5, textLines.length * 4);
  }

  // Footer
  y += 6;
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('This is a screening tool, not a diagnostic instrument. High scores should be followed up with specialist assessment.', margin, y, { maxWidth: contentWidth });
  y += 6;
  const refs: Record<string, string> = {
    'AQ-50': 'Reference: Baron-Cohen et al. (2001). J Autism Dev Disord, 31, 5–17.',
    'CAT-Q': 'Reference: Hull, L. et al. (2019). J Autism Dev Disord, 49(3), 819–833.',
    'RAADS-R': 'Reference: Ritvo et al. (2011). J Autism Dev Disord, 41(8), 1076–1089.',
    'EQ': 'Reference: Baron-Cohen & Wheelwright (2004). J Autism Dev Disord, 34(2), 163–175.',
    'SQ': 'Reference: Wheelwright et al. (2006). J Autism Dev Disord, 36(2), 263–281.',
    'RBQ-2A': 'Reference: Barrett et al. (2015). J Autism Dev Disord, 45(11), 3680–3692.',
  };
  const ref = refs[result.testType] || '';
  doc.text(ref, margin, y, { maxWidth: contentWidth });

  doc.save(`${result.testType}_${result.userName.replace(/\s+/g, '_')}_${new Date(result.date).toISOString().slice(0, 10)}.pdf`);
}

export function exportMultipleResultsPDF(results: TestResult[]): void {
  if (results.length === 0) return;
  if (results.length === 1) { exportResultPDF(results[0]); return; }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const titles: Record<string, string> = {
    'AQ-50': 'Autism Spectrum Quotient (AQ-50)',
    'CAT-Q': 'Camouflaging Autistic Traits Questionnaire (CAT-Q)',
    'RAADS-R': 'Ritvo Autism Asperger Diagnostic Scale-Revised (RAADS-R)',
    'EQ': 'Empathy Quotient (EQ)',
    'SQ': 'Systemizing Quotient-Revised (SQ-R)',
    'RBQ-2A': 'Repetitive Behaviours Questionnaire (RBQ-2A)',
  };

  // --- Cover page ---
  let y = 40;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SPECTRUM', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Combined Screening Report', pageWidth / 2, y, { align: 'center' });
  y += 14;

  // Divider
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Subject info (use first result's userName)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Subject:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(results[0].userName, margin + 22, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Generated:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('en-CA'), margin + 28, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Tests included:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(results.length), margin + 38, y);
  y += 14;

  // Summary table header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 8;

  // Table header row
  doc.setFillColor(40, 40, 40);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'bold');
  doc.text('Test', margin + 3, y);
  doc.text('Date', margin + 45, y);
  doc.text('Score', margin + 80, y);
  doc.text('Max', margin + 100, y);
  doc.text('Category', margin + 118, y);
  doc.setTextColor(0, 0, 0);
  y += 8;

  // Table rows
  doc.setFontSize(9);
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const category = getScoreCategory(r.testType, r.totalScore);
    const catLabel = category === 'high' ? 'ABOVE THRESHOLD' : category === 'borderline' ? 'BORDERLINE' : 'BELOW THRESHOLD';

    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, contentWidth, 7, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.text(r.testType, margin + 3, y);
    doc.text(new Date(r.date).toLocaleDateString('en-CA'), margin + 45, y);
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.totalScore), margin + 80, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(r.maxScore), margin + 100, y);

    // Color-coded category
    const catColor: [number, number, number] =
      category === 'high' ? [220, 53, 69] :
      category === 'borderline' ? [200, 150, 0] :
      [40, 167, 69];
    doc.setTextColor(...catColor);
    doc.setFont('helvetica', 'bold');
    doc.text(catLabel, margin + 118, y);
    doc.setTextColor(0, 0, 0);

    y += 7;
  }

  y += 8;
  doc.setDrawColor(100, 100, 100);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Individual test reports follow on subsequent pages.', margin, y);

  // --- Individual test pages ---
  for (const result of results) {
    doc.addPage();
    let py = 20;

    const questionMap: Record<string, Question[]> = {
      'AQ-50': AQ50_QUESTIONS,
      'CAT-Q': CATQ_QUESTIONS,
      'RAADS-R': RAADSR_QUESTIONS,
      'SQ': SQ_QUESTIONS,
      'EQ': EQ_QUESTIONS,
      'RBQ-2A': RBQ2A_QUESTIONS,
    };
    const questions = questionMap[result.testType] || [];

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const title = titles[result.testType] || result.testType;
    doc.text(title, margin, py, { maxWidth: contentWidth });
    py += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Screening Questionnaire — Results Report', margin, py);
    py += 10;

    doc.setDrawColor(100, 100, 100);
    doc.line(margin, py, pageWidth - margin, py);
    py += 8;

    // Patient info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, py);
    doc.setFont('helvetica', 'normal');
    doc.text(result.userName, margin + 18, py);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin + 90, py);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(result.date).toLocaleDateString('en-CA'), margin + 104, py);
    py += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Test:', margin, py);
    doc.setFont('helvetica', 'normal');
    doc.text(result.testType, margin + 18, py);
    py += 10;

    // Score box
    const category = getScoreCategory(result.testType, result.totalScore);
    const boxColor: [number, number, number] =
      category === 'high' ? [220, 53, 69] :
      category === 'borderline' ? [255, 193, 7] :
      [40, 167, 69];

    doc.setFillColor(...boxColor);
    doc.roundedRect(margin, py, contentWidth, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Score: ${result.totalScore} / ${result.maxScore}`, margin + 6, py + 8);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(result.interpretation, margin + 6, py + 15, { maxWidth: contentWidth - 12 });
    doc.setTextColor(0, 0, 0);
    py += 28;

    // Subscales
    if (result.subscaleScores) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Subscale Scores', margin, py);
      py += 6;

      const labels = getSubscaleLabels(result.testType);
      const maxScores = getSubscaleMax(result.testType);

      for (const subscale of Object.keys(result.subscaleScores)) {
        const score = result.subscaleScores[subscale];
        const maxVal = maxScores[subscale] || 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${labels[subscale] || subscale}:`, margin + 4, py);
        doc.setFont('helvetica', 'bold');
        doc.text(`${score} / ${maxVal}`, margin + 55, py);

        doc.setFillColor(220, 220, 220);
        doc.rect(margin + 72, py - 3, 60, 4, 'F');
        doc.setFillColor(...boxColor);
        doc.rect(margin + 72, py - 3, 60 * (score / maxVal), 4, 'F');
        py += 6;
      }
      py += 6;
    }

    // Questions table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Responses', margin, py);
    py += 6;

    const isRBQ2A = result.testType === 'RBQ-2A';
    const genericOpts = getAnswerOptions(result.testType);
    const genericLbls: Record<number, string> = {};
    for (const opt of genericOpts) {
      genericLbls[opt.value] = opt.label;
    }

    doc.setFontSize(8);
    for (const question of questions) {
      if (py > 270) {
        doc.addPage();
        py = 20;
      }

      const answer = result.answers.find(a => a.questionId === question.id);
      let answerText = '\u2014';
      if (answer) {
        if (isRBQ2A) {
          const qOpts = getRBQ2AOptionsForQuestion(question.id);
          const match = qOpts.find(o => o.value === answer.value);
          answerText = match ? match.label : String(answer.value);
        } else {
          answerText = genericLbls[answer.value] || String(answer.value);
        }
      }

      if (question.id % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, py - 3.5, contentWidth, 5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`${question.id}.`, margin, py);
      doc.setFont('helvetica', 'normal');

      const textLines = doc.splitTextToSize(question.text, contentWidth - 55);
      doc.text(textLines, margin + 8, py);
      doc.setFont('helvetica', 'bold');
      doc.text(answerText, pageWidth - margin - 35, py);
      py += Math.max(5, textLines.length * 4);
    }

    // Footer
    py += 6;
    if (py > 270) {
      doc.addPage();
      py = 20;
    }
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, py, pageWidth - margin, py);
    py += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a screening tool, not a diagnostic instrument. High scores should be followed up with specialist assessment.', margin, py, { maxWidth: contentWidth });
    py += 6;
    const refs: Record<string, string> = {
      'AQ-50': 'Reference: Baron-Cohen et al. (2001). J Autism Dev Disord, 31, 5\u201317.',
      'CAT-Q': 'Reference: Hull, L. et al. (2019). J Autism Dev Disord, 49(3), 819\u2013833.',
      'RAADS-R': 'Reference: Ritvo et al. (2011). J Autism Dev Disord, 41(8), 1076\u20131089.',
      'EQ': 'Reference: Baron-Cohen & Wheelwright (2004). J Autism Dev Disord, 34(2), 163\u2013175.',
      'SQ': 'Reference: Wheelwright et al. (2006). J Autism Dev Disord, 36(2), 263\u2013281.',
      'RBQ-2A': 'Reference: Barrett et al. (2015). J Autism Dev Disord, 45(11), 3680\u20133692.',
    };
    const ref = refs[result.testType] || '';
    doc.text(ref, margin, py, { maxWidth: contentWidth });
  }

  // File name
  const firstName = results[0].userName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Combined_Report_${firstName}_${dateStr}.pdf`);
}
