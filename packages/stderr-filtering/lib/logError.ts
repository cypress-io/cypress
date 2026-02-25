/**
 * Standard error logging tags used for stderr filtering
 */
import { START_TAG, END_TAG } from './constants'
import { tagsDisabled } from './tagsDisabled'

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
  // When electron debug is enabled, the output will not be filtered, so
  // these tags are not needed.
  if (tagsDisabled()) {
    // eslint-disable-next-line no-console
    console.error(...args)
  } else {
    // eslint-disable-next-line no-console
    console.error(START_TAG, ...args, END_TAG)
  }
}
