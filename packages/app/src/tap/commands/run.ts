import { posixify } from '../../paths'
import { defineCommand, TapCommandError } from './definition'
import { getRunnableSpecs, toSpecListEntry } from './specs-list'
import type { SpecListEntry } from './specs-list'

// Distinguishes each `run` invocation in the runner URL so rerunning the
// already-active spec still produces a query change (see the handler).
let tapRunNonce = 0

/**
 * Seam over the one side effect `run` performs. Component tests stub this —
 * really navigating there moves the spec frame and stops the test
 * mid-command. The hash setter (rather than `location.href = '#…'`) is what
 * guarantees a synchronous same-document fragment navigation, including when
 * the runner page is itself an AUT (the cypress-in-cypress harness).
 */
export const tapNavigation = {
  setHash (hash: string) {
    window.location.hash = hash
  },
}

export const runCommand = defineCommand({
  description: 'run (or rerun) a spec by its project-relative path',
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
  // Triggering is fire-and-forget: returning the started spec means navigation
  // was issued, not that the spec finished or passed. The two failure cases
  // throw — surfaced on stderr, never stdout, and the runner never navigates:
  // INVALID_SPEC for an empty path, SPEC_NOT_FOUND when none matches.
  handler: async ({ spec }): Promise<SpecListEntry> => {
    if (spec.length === 0) {
      throw new TapCommandError('INVALID_SPEC', 'spec must be a non-empty string (a project-relative spec path)')
    }

    const wanted = posixify(spec)
    const match = getRunnableSpecs().find((entry) => posixify(entry.relative) === wanted)

    if (!match) {
      throw new TapCommandError('SPEC_NOT_FOUND', `no spec matches the path "${spec}" — use the specs command to list runnable specs`)
    }

    // The tapRun nonce makes route.query differ from the previous query, so
    // the unifiedRunner watchSpecs effect always kicks off a fresh run —
    // even when this spec is already active (rerun). Hash navigation never
    // reloads the page, so this promise still resolves over CDP. The path
    // travels in posix form because watchSpecs converts route.query.file
    // back via getPathForPlatform.
    const file = encodeURIComponent(posixify(match.relative)).replace(/%2F/g, '/')

    tapNavigation.setHash(`/specs/runner?file=${file}&tapRun=${++tapRunNonce}`)

    return toSpecListEntry(match)
  },
})
