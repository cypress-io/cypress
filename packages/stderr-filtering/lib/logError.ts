/**
 * Standard error logging tags used for stderr filtering.a
 */
import { START_TAG, END_TAG } from './constants'

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
