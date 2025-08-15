/**
 * These tags are used to mark the beginning and end of error content that should
 * be filtered from stderr output. The tags are designed to be unique and easily
 * identifiable in log output.
 */
export const START_TAG = '<<<CYPRESS.STDERR.START>>>'

/**
 * Marks the end of error content that should be filtered from stderr output.
 */
export const END_TAG = '<<<CYPRESS.STDERR.END>>>'
