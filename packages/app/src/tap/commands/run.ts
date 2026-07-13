import { posixify } from '../../paths'
import { defineCommand, TapCommandError } from './definition'
import { getRunnableSpecs, toSpecListEntry } from './specs-list'
import type { SpecListEntry } from './specs-list'

// Seam so component tests can stub navigation — really navigating would stop
// the test mid-command. The `hash` setter (not `href`) keeps it a synchronous
// same-document navigation, so `exec` still resolves over CDP.
export const tapNavigation = {
  getHash () {
    return window.location.hash
  },
  setHash (hash: string) {
    window.location.hash = hash
  },
}

// watchSpecs only reruns a spec when route.query changes, so bump past whatever
// tapRun the hash already holds — module state would reset to zero on a page
// reload while the old value survives in the URL.
const nextTapRunNonce = () => {
  const current = /[?&]tapRun=(\d+)/.exec(tapNavigation.getHash())

  return (current ? Number(current[1]) : 0) + 1
}

export const runCommand = defineCommand({
  description: 'run (or rerun) a spec by its project-relative path',
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
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

    tapNavigation.setHash(`/specs/runner?file=${file}&tapRun=${nextTapRunNonce()}`)

    return toSpecListEntry(match)
  },
})
