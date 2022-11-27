/**
 * Helper function to truncate a string to a given length.
 * @param {string} strToTruncate - string to truncate
 * @param {number} maxLength - max length of the string
 * @returns {string} string truncated to maxLength
 */
export default function truncateString ({ strToTruncate, maxLength }) {
  return (strToTruncate.length > maxLength) ? `${strToTruncate.slice(0, maxLength)}...` : strToTruncate
}
