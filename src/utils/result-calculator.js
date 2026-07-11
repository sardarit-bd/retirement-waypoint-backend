/**
 * Calculate domain scores from answers
 */
export const calculateDomainScores = (domains, answers) => {
  const domainScores = [];

  domains.forEach((domain) => {
    const domainAnswers = answers.filter(a => a.domainId === domain.id);
    let totalScore = 0;
    let maxScore = 0;

    domainAnswers.forEach((answer) => {
      // ✅ Find question by stored ID
      const question = domain.questions.find(q => q.id === answer.questionId);
      if (question) {
        const option = question.options.find(o => o.value === answer.value);
        if (option) {
          totalScore += option.score || 0;
          maxScore += Math.max(...question.options.map(o => o.score || 0));
        }
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    domainScores.push({
      domainId: domain.id,
      domainKey: domain.key,
      domainLabel: domain.label,
      score: totalScore,
      maxScore: maxScore,
      percentage,
    });
  });

  return domainScores;
};

/**
 * Calculate overall score from domain scores
 */
export const calculateOverallScore = (domainScores) => {
  if (!domainScores || domainScores.length === 0) return 0;

  const totalPercentage = domainScores.reduce((sum, ds) => sum + ds.percentage, 0);
  return Math.round(totalPercentage / domainScores.length);
};

/**
 * Find matching result range based on overall score
 */
export const findResultRange = (ranges, overallScore) => {
  if (!ranges || ranges.length === 0) return null;

  return ranges.find(
    range => overallScore >= range.minScore && overallScore <= range.maxScore
  ) || null;
};

/**
 * ✅ Validate answers against assessment questions using stored IDs
 */
export const validateAnswers = (domains, answers) => {
  const errors = [];

  // Get all question IDs from assessment (stored IDs)
  const allQuestionIds = [];
  domains.forEach(domain => {
    domain.questions.forEach(q => {
      allQuestionIds.push(q.id);
    });
  });

  // Check if all questions are answered
  const answeredQuestionIds = answers.map(a => a.questionId);
  const missingQuestions = allQuestionIds.filter(id => !answeredQuestionIds.includes(id));

  if (missingQuestions.length > 0) {
    errors.push(`Missing answers for questions: ${missingQuestions.join(', ')}`);
  }

  // Check for invalid question IDs (not found in assessment)
  const invalidQuestions = answers.filter(a => !allQuestionIds.includes(a.questionId));
  if (invalidQuestions.length > 0) {
    errors.push(`Invalid question IDs: ${invalidQuestions.map(a => a.questionId).join(', ')}`);
  }

  // Check domain validity
  const domainIds = domains.map(d => d.id);
  const invalidDomains = answers.filter(a => !domainIds.includes(a.domainId));
  if (invalidDomains.length > 0) {
    errors.push(`Invalid domain IDs: ${invalidDomains.map(a => a.domainId).join(', ')}`);
  }

  return errors;
};

/**
 * Generate recommendations from result range
 */
export const generateRecommendations = (resultRange) => {
  if (!resultRange || !resultRange.recommendations) return [];
  return resultRange.recommendations.map(r => ({ text: r.text }));
};