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

export type Shape = 'token' | 'text' | 'url'

// `git@github.com:owner/repo.git` — scp-like syntax, which `new URL()` rejects
const SCP_LIKE = /^[\w.-]+@[\w.-]+:[^\s]+$/

/**
 * Repository URLs can carry credentials — GitLab hands every job a
 * `CI_REPOSITORY_URL` of `https://gitlab-ci-token:<token>@host/group/project.git`.
 *
 * A value that doesn't parse as a URL is still returned as-is: providers put
 * unexpected things in URL-ish variables, and the structural checks have
 * already passed. Only the credentials are removed.
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

  return shape === 'url' ? stripCredentials(trimmed, key) : trimmed
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
 * Variables whose value is a URL, and so may arrive carrying credentials.
 * Everything not listed is checked as a `token`.
 */
const URL_PARAMS = [
  'ARGOCD_APP_SOURCE_REPO_URL',
  'ATC_EXTERNAL_URL',
  'AWS_CLONE_URL',
  'BITRISE_BUILD_URL',
  'BUDDY_REPO_SSH_URL',
  'BUDDY_RUN_URL',
  'BUILDKITE_BUILD_URL',
  'BUILDKITE_PULL_REQUEST_REPO',
  'BUILDKITE_REPO',
  'BUILD_REPOSITORY_URI',
  'BUILD_URL',
  'CF_BUILD_URL',
  'CHANGE_URL',
  'CIRCLE_BUILD_URL',
  'CIRCLE_COMPARE_URL',
  'CIRCLE_PULL_REQUEST',
  'CIRCLE_REPOSITORY_URL',
  'CI_BUILD_LINK',
  'CI_ENVIRONMENT_URL',
  'CI_JOB_URL',
  'CI_PIPELINE_URL',
  'CI_PROJECT_URL',
  'CI_PULL_REQUEST',
  'CI_REPOSITORY_URL',
  'CODEBUILD_SOURCE_REPO_URL',
  'CYPRESS_CI_BUILD_URL',
  'CYPRESS_PULL_REQUEST_URL',
  'DEPLOY_PRIME_URL',
  'DEPLOY_URL',
  'DRONE_BUILD_LINK',
  'GIT_REPOSITORY_URL',
  'GO_SERVER_URL',
  'SEMAPHORE_GIT_URL',
  'SEMAPHORE_ORGANIZATION_URL',
  'TRAVIS_BUILD_WEB_URL',
  'URL',
  'bamboo_buildResultsUrl',
  'bamboo_planRepository_repositoryUrl',
] as const

const TEXT_PARAMS = ['BUDDY_RUN_COMMIT_MESSAGE'] as const

export const CI_PARAM_SHAPES: Record<string, Shape> = {
  ...Object.fromEntries(URL_PARAMS.map((k) => [k, 'url' as const])),
  ...Object.fromEntries(TEXT_PARAMS.map((k) => [k, 'text' as const])),
}

/**
 * Shapes for the `commit` fields. These mean the same thing for every provider,
 * so unlike `ci.params` they key off the field name rather than the variable.
 */
export const COMMIT_SHAPES: Record<string, Shape> = {
  message: 'text',
  remoteOrigin: 'url',
}
