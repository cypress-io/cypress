/**
 * Standard error logging tags used for stderr filtering.
 *
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
 * Logs error messages with special tags for stderr filtering.
 *
 * This function wraps console.error calls with start and end tags that can be
 * used by FilterTaggedContent to identify and filter error messages from stderr
 * output. The tags allow for precise control over which error messages are
 * filtered while preserving the original error content.
 *
 * @param args The arguments to log as an error message
 */
export const logError = (...args: any[]) => {
  // eslint-disable-next-line no-console
  console.error(START_TAG, ...args, END_TAG)
}
