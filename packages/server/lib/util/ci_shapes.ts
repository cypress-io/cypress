import debugModule from 'debug'

const debug = debugModule('cypress:server:record:ci-info')
// Every variable that carried a value and what became of it. `debug` reports
// only the values it rejected, which is the actionable subset.
const debugVerbose = debugModule('cypress-verbose:server:record:ci-info')

/**
 * Shape checks for values read out of the CI environment.
 *
 * A value that fails a check is dropped and the run records without it.
 * Dropping is silent by design: a malformed CI variable is the provider's
 * problem, not something the user can act on mid-run, so it must never
 * interrupt recording.
 *
 * Credentials are stripped rather than dropped, since the rest of the value is
 * still worth recording.
 *
 * These checks are deliberately structural — empty, placeholder, unexpanded,
 * unprintable, oversized — and never assert a provider-specific format. A
 * regex for "looks like a build number" would be a guess about a value we do
 * not control, and dropping a correlation key on a wrong guess fails the whole
 * run with an indeterminate-ciBuildId error. Structural checks cannot mistake a
 * real value for a malformed one.
 */

// Long enough for any real identifier, URL or slug; short enough that a
// runaway variable can't bloat every run payload.
const MAX_LENGTH = 512
// Commit messages are the one field that is legitimately long and multiline.
const MAX_TEXT_LENGTH = 2000

// A CI variable referenced but never expanded arrives as its own template:
// `$(Build.BuildId)` from Azure classic pipelines, `${CI_JOB_ID}` from a shell
// that never substituted. Recording those is worse than recording nothing,
// because every machine in the run reports the same placeholder and Cloud
// correlates them as one build.
const UNEXPANDED_TEMPLATE = /\$[({][^)}]*[)}]/
const PLACEHOLDER = /^(null|undefined|\(null\)|nil|<unset>)$/i
// Tab, newline and carriage return are handled per-shape below; anything else
// in the C0/C1 range means the variable is holding something other than a value
// — an ANSI escape from colourised tooling, most often.
// `no-control-regex` exists to catch these characters appearing in a pattern by
// accident, where they are invisible to a reader. Matching them is the whole
// point here, so the rule is disabled rather than worked around.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/

export type Shape = 'token' | 'text'

// `git@github.com:owner/repo.git` — scp-like syntax, which `new URL()` rejects
const SCP_LIKE = /^[\w.-]+@[\w.-]+:[^\s]+$/

/**
 * Any captured value can turn out to be a URL carrying credentials — GitLab
 * hands every job a `CI_REPOSITORY_URL` of
 * `https://gitlab-ci-token:<token>@host/group/project.git`. This runs over every
 * value rather than a list of the variables believed to hold URLs, because such
 * a list silently stops protecting the moment a provider adds one.
 *
 * Anything that isn't a URL, or is one without credentials, is returned
 * untouched — no normalisation is applied to values that need no change.
 */
const stripCredentials = (value: string, key: string) => {
  if (SCP_LIKE.test(value)) {
    return value
  }

  let url: URL

  try {
    url = new URL(value)
  } catch {
    return value
  }

  if (!url.username && !url.password) {
    return value
  }

  url.username = ''
  url.password = ''
  debug('stripped credentials from %s', key)

  return url.toString()
}

const evaluate = (key: string, value: string, shape: Shape) => {
  const trimmed = value.trim()

  if (!trimmed) {
    debug('dropped %s: empty', key)

    return undefined
  }

  if (trimmed.length > (shape === 'text' ? MAX_TEXT_LENGTH : MAX_LENGTH)) {
    debug('dropped %s: %d chars exceeds the limit', key, trimmed.length)

    return undefined
  }

  if (PLACEHOLDER.test(trimmed)) {
    debug('dropped %s: placeholder value %o', key, trimmed)

    return undefined
  }

  if (UNEXPANDED_TEMPLATE.test(trimmed)) {
    debug('dropped %s: unexpanded template %o', key, trimmed)

    return undefined
  }

  if (CONTROL_CHARS.test(trimmed)) {
    debug('dropped %s: contains control characters', key)

    return undefined
  }

  // `text` allows the newlines a commit message needs; every other value is a
  // single-line identifier, and a newline in one means it is not what we think.
  if (shape !== 'text' && /[\r\n]/.test(trimmed)) {
    debug('dropped %s: unexpected newline', key)

    return undefined
  }

  return stripCredentials(trimmed, key)
}

/**
 * Returns the value to record, or `undefined` to record nothing.
 */
export const check = (key: string, value: string | undefined, shape: Shape = 'token') => {
  // An unset variable is the normal case for every provider we didn't detect,
  // so it isn't worth reporting even verbosely.
  if (value == null) {
    return undefined
  }

  const result = evaluate(key, value, shape)

  // Only ever the result: the raw value may still hold the credentials
  // `stripCredentials` just removed.
  debugVerbose('%s (%s) %s', key, shape, result === undefined ? 'not recorded' : `recorded as ${result}`)

  return result
}

/**
 * The only value needing anything other than the default: a commit message is
 * legitimately long and multiline, where every other captured value is a
 * single-line identifier.
 */
export const COMMIT_SHAPES: Record<string, Shape> = {
  message: 'text',
}
