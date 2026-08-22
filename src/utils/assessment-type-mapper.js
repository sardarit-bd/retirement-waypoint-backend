/**
 * Maps human-readable Assessment Type badges to numeric values.
 *
 * The client has specified:
 *   Pre-Retiree    = 1
 *   Recent Retiree = 2
 *
 * The client has NOT provided a numeric value for "Established Retiree".
 * It is intentionally left out — getAssessmentTypeValue() returns null
 * for any badge without a defined mapping.
 */
export const ASSESSMENT_TYPE_VALUES = {
  'Pre-Retiree': 1,
  'Recent Retiree': 2,
};

/**
 * Returns the numeric value for a given assessment badge.
 * Returns null when no mapping exists (e.g. "Established Retiree").
 * @param {string|undefined} badge - The assessment type badge from assessment.introduction.badge
 * @returns {number|null}
 */
export const getAssessmentTypeValue = (badge) => {
  if (!badge || typeof badge !== 'string') return null;
  return ASSESSMENT_TYPE_VALUES[badge] ?? null;
};
