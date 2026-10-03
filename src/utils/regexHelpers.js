/**
 * Escapes special regular expression characters in user input to prevent ReDoS
 * and unintended regex pattern matching.
 * 
 * @param {string} string - Raw string to escape
 * @returns {string} Regex-safe escaped string
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
