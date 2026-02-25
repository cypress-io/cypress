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

/**
 * A regex that will match output from the 'debug' package
 */
// this regexp needs to match control characters
// eslint-disable-next-line no-control-regex
export const DEBUG_PREFIX = /^\s+(?:\u001b\[[0-9;]*m)*((\S+):)+/u
