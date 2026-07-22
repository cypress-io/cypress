import { posixify } from '../../paths'
import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand, TapCommandError } from './definition'
import { aggregateResults } from './test-state'
import type { RunAck } from '../types'

const nextTapRunNonce = () => {
  const query = tapManagerDataSource.getHash().split('?')[1] ?? ''
  const current = Number(new URLSearchParams(query).get('tapRun'))

  return (Number.isInteger(current) ? current : 0) + 1
}

const RUN_TESTS_WAIT_MS = 5000
const RUN_TESTS_POLL_MS = 50

// Mocha registers every test at spec-parse time, before the first command runs,
// so the count is readable shortly after firing — and before any cross-origin
// cy.visit could swap the runner frame out from under us. Poll until the newly
// started run has registered its tests, giving up (count omitted) on timeout.
const countStartedTests = async (wanted: string): Promise<number | undefined> => {
  const deadline = Date.now() + RUN_TESTS_WAIT_MS

  while (Date.now() < deadline) {
    const runner = tapManagerDataSource.getRunner()
    const active = tapManagerDataSource.getActiveSpecRelative()

    if (runner && active && posixify(active) === wanted) {
      const { totalTests } = aggregateResults(runner)

      if (totalTests > 0) {
        return totalTests
      }
    }

    await new Promise((resolve) => setTimeout(resolve, RUN_TESTS_POLL_MS))
  }

  return undefined
}

export const runCommand = defineCommand({
  description: 'run (or rerun) a spec by its project-relative path',
  params: [
    { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the specs command' },
  ],
  handler: async ({ spec }): Promise<RunAck> => {
    if (spec.length === 0) {
      throw new TapCommandError('INVALID_SPEC', 'spec must be a non-empty string (a project-relative spec path)')
    }

    const wanted = posixify(spec)
    const match = tapManagerDataSource.getRunnableSpecs().find((entry) => posixify(entry.relative) === wanted)

    if (!match) {
      throw new TapCommandError('SPEC_NOT_FOUND', `no spec matches the path "${spec}" — use the specs command to list runnable specs`)
    }

    // Encode each segment but keep the slashes literal, since watchSpecs reads
    // route.query.file back through getPathForPlatform.
    const file = posixify(match.relative).split('/').map(encodeURIComponent).join('/')

    tapManagerDataSource.setHash(`/specs/runner?file=${file}&tapRun=${nextTapRunNonce()}`)

    const totalTests = await countStartedTests(wanted)

    return {
      spec: match.relative,
      status: 'running',
      ...(totalTests !== undefined ? { totalTests } : {}),
      message: 'spec is running — poll `cypress tap status` for progress',
    }
  },
})
