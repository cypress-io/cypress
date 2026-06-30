import { posixify } from '../../paths'
import { defineCommand, TapCommandError } from './definition'
import { getRunnableSpecs, toSpecListEntry } from './specs-list'
import type { SpecListEntry } from './specs-list'

// Bumped per invocation so rerunning the active spec still changes route.query,
// which is what makes unifiedRunner's watchSpecs kick off a fresh run.
let tapRunNonce = 0

/**
 * Seam over the command's one side effect so component tests can stub it —
 * really navigating moves the spec frame and stops the test mid-command. Uses
 * the `hash` setter (not `location.href`) for a synchronous same-document
 * navigation that never reloads, so the `exec` promise still resolves over CDP
 * even when the runner page is itself an AUT (cypress-in-cypress).
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
  // Fire-and-forget: a successful return means the run was triggered, not that
  // the spec finished or passed.
  handler: async ({ spec }): Promise<SpecListEntry> => {
    if (spec.length === 0) {
      throw new TapCommandError('INVALID_SPEC', 'spec must be a non-empty string (a project-relative spec path)')
    }

    const wanted = posixify(spec)
    const match = getRunnableSpecs().find((entry) => posixify(entry.relative) === wanted)

    if (!match) {
      throw new TapCommandError('SPEC_NOT_FOUND', `no spec matches the path "${spec}" — use the specs command to list runnable specs`)
    }

    // Encode the path but keep its slashes literal, since watchSpecs reads
    // route.query.file back through getPathForPlatform.
    const file = encodeURIComponent(posixify(match.relative)).replace(/%2F/g, '/')

    tapNavigation.setHash(`/specs/runner?file=${file}&tapRun=${++tapRunNonce}`)

    return toSpecListEntry(match)
  },
})
