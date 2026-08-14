import { vi } from 'vitest'

import logger from '../../../lib/logger'
import { listLiveInstances, resolveLiveInstance, resolveInstance } from '../../../lib/cypress-sessions'
import type { ReadyInstanceState, InstanceSelection } from '../../../lib/cypress-sessions'
import { withTapConnection } from '../../../lib/tap/tap-connection'
import type { TapConnection } from '../../../lib/tap/tap-connection'
import { queryInstanceGraphql } from '../../../lib/tap/instance-gql'
import { withResolvedAutFrame } from '../../../lib/tap/aut/frame'
import type { TapExecResult, TapSchema } from '@packages/cypress-sessions'

export const tapError = (details: { description: string, solution: string }, message: string): Error => {
  return Object.assign(new Error(message), { details, known: true })
}

export const schema: TapSchema = {
  schemaVersion: 1,
  cypressVersion: '15.0.0',
  commands: [
    {
      name: 'health',
      description: 'check that a running Cypress instance is reachable and its tap binding responds',
      params: [],
      options: [],
    },
    {
      name: 'fake-command-for-testing',
      description: 'a fake command, advertised only by this test\'s schema, exercising schema-forwarded dispatch',
      params: [
        { name: 'spec', type: 'string', required: true, description: 'project-relative spec path, as listed by the spec command' },
      ],
      options: [
        { name: 'browser', alias: 'b', type: 'string', required: false, description: 'which browser to run in' },
        { name: 'headed', type: 'boolean', required: false, description: 'show the browser' },
      ],
    },
  ],
}

export const mockConnection = (connectionSchema: unknown = schema, execOutcome: unknown = { result: 'ok' } satisfies TapExecResult) => {
  const call = vi.fn(async (method: string) => {
    return method === 'getSchema' ? connectionSchema : execOutcome
  })

  // These tests drive the binding exec/status paths, which use only `call`;
  // the frame extractors (dom/aria/inspect, which use client/sessionId) are
  // covered separately, so the session's CDP members are stubbed away here.
  vi.mocked(withTapConnection).mockImplementation(async (_runner, fn) => fn({ call } as unknown as TapConnection))

  return call
}

export const readyInstance = (overrides: Partial<ReadyInstanceState> = {}): ReadyInstanceState => ({
  schemaVersion: 1,
  pid: 4242,
  projectRoot: '/projects/app',
  serverPort: 49200,
  instanceId: 'inst-1',
  testingType: 'e2e',
  cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
  browserName: 'Chrome',
  browserFamily: 'chromium',
  machineId: null,
  userId: null,
  ...overrides,
})

export const mockResolved = (overrides: Partial<InstanceSelection> = {}): InstanceSelection => {
  const selection: InstanceSelection = { instance: readyInstance(), reason: 'only', candidateCount: 1, ...overrides }

  vi.mocked(resolveInstance).mockResolvedValue(selection)

  return selection
}

// Every invocation reports itself to the Cloud event collector, so nothing in
// these specs is allowed to reach the network.
export const fetchMock = vi.fn()

export const reportedEvent = () => JSON.parse(fetchMock.mock.calls.at(-1)![1].body).payload

export const resetTapMocks = (): void => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ status: 200 })
  vi.stubGlobal('fetch', fetchMock)
  vi.mocked(withTapConnection).mockReset()
  vi.mocked(queryInstanceGraphql).mockReset()
  vi.mocked(listLiveInstances).mockReset()
  vi.mocked(resolveLiveInstance).mockReset()
  vi.mocked(resolveInstance).mockReset()
  vi.mocked(withResolvedAutFrame).mockReset()
  vi.mocked(withResolvedAutFrame).mockResolvedValue(0)
  mockResolved()
  logger.reset()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
}
