import { posixify } from '../../paths'
import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { toSpecListEntry } from '../specs-list'
import type { SpecListEntry } from '../types'

const nextTapRunNonce = () => {
  const query = tapManagerDataSource.getHash().split('?')[1] ?? ''
  const current = Number(new URLSearchParams(query).get('tapRun'))

  return (Number.isInteger(current) ? current : 0) + 1
}

export const runCommand = defineCommand({
  description: 'run (or rerun) a spec by its project-relative path',
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
  handler: async ({ spec }, _options, runtime): Promise<SpecListEntry> => {
    if (spec.length === 0) {
      throw new TapCommandError('INVALID_SPEC', 'spec must be a non-empty string (a project-relative spec path)')
    }

    const wanted = posixify(spec)
    const specs = await tapManagerDataSource.getRunnableSpecs(runtime.gqlClient)
    const match = specs.find((entry) => posixify(entry.relative) === wanted)

    if (!match) {
      throw new TapCommandError('SPEC_NOT_FOUND', `no spec matches the path "${spec}" — use the specs command to list runnable specs`)
    }

    // Encode each segment but keep the slashes literal, since watchSpecs reads
    // route.query.file back through getPathForPlatform.
    const file = posixify(match.relative).split('/').map(encodeURIComponent).join('/')

    tapManagerDataSource.setHash(`/specs/runner?file=${file}&tapRun=${nextTapRunNonce()}`)

    return toSpecListEntry(match)
  },
})
