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
 * A regex that will match output from the 'debug' package: indented lines whose
 * first word holds a colon after its first character, such as
 * `  \u001b[35;1mcypress:server:util \u001b[0mmessage`.
 *
 * ANSI color codes contain no whitespace, so `\S` covers them without a separate
 * group. `[^\s:]*` can't consume the colon it stops at, which keeps matching linear.
 */
export const DEBUG_PREFIX = /^\s+\S[^\s:]*:/u
