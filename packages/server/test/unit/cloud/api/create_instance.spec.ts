import pkg from '@packages/root'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import api from '../../../../lib/cloud/api'
import { createInstance as axiosCreateInstance, CreateInstanceRequestBody, CreateInstanceResponse } from '../../../../lib/cloud/api/create_instance'
import * as errors from '../../../../lib/errors'

const API_BASEURL = 'http://localhost:1234'
const OS_PLATFORM = 'linux'

const AXIOS_LABEL = 'axios createInstance'
const REQUEST_LABEL = 'request createInstance'

/**
 * Re-run [`vi.runAllTimersAsync`](https://vitest.dev/api/vi#vi-runalltimersasync) until `operation`
 * settles — the pattern Vitest documents for async code under fake timers (see
 * [Mocking timers](https://vitest.dev/guide/mocking/timers)).
 */
async function runAllTimersUntilSettled (operation: Promise<unknown>): Promise<void> {
  const maxRounds = 50

  for (let i = 0; i < maxRounds; i++) {
    const settled = await Promise.race([
      operation.then(() => true as const).catch(() => true as const),
      vi.runAllTimersAsync().then(() => false as const),
    ])

    if (settled) {
      return
    }
  }
}

describe('API createInstance', () => {
  let nocked: nock.Interceptor
  const runId = 'run-id-123'

  const instanceRequestData: CreateInstanceRequestBody = {
    spec: null,
    groupId: 'groupId123',
    machineId: 'machineId123',
    platform: {
      osName: OS_PLATFORM,
      osVersion: '',
      browserName: 'browser',
      browserVersion: '1.2.3',
      osCpus: [],
      osMemory: null,
    },
  }

  const instanceResponseData: CreateInstanceResponse = {
    instanceId: 'instance-id-123',
    claimedInstances: 0,
    estimatedWallClockDuration: null,
    spec: null,
    totalInstances: 0,
  }

  beforeEach(() => {
    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    nocked = nock(API_BASEURL)
    .matchHeader('x-cypress-run-id', runId)
    .matchHeader('x-cypress-version', pkg.version)
    .post(`/runs/${runId}/instances`)

    api.setPreflightResult({ encrypt: false })
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
    api.resetPreflightResult()
  })

  ;[
    {
      label: AXIOS_LABEL,
      fn: axiosCreateInstance,
    },
    {
      label: REQUEST_LABEL,
      fn: api.createInstance,
    },
  ].forEach(({ label, fn: createInstance }) => {
    describe(label, () => {
      describe('when the request succeeds', () => {
        beforeEach(() => {
          nocked.reply(200, instanceResponseData)
        })

        it('returns the created instance', async () => {
          const response = await createInstance(runId, instanceRequestData)

          for (const k in instanceResponseData) {
            expect(instanceResponseData[k as keyof CreateInstanceResponse]).toBe(response[k as keyof CreateInstanceResponse])
          }
        })
      })

      describe('when the request times out 4 times', () => {
        const timeout = 10
        let oldIntervals: string | undefined

        beforeEach(() => {
          vi.spyOn(errors, 'warning').mockImplementation(() => null)
          vi.useFakeTimers()
          oldIntervals = process.env.API_RETRY_INTERVALS
          process.env.API_RETRY_INTERVALS = '0,0,0'
          nocked
          .times(4)
          .delayConnection(5000)
          .reply(200, instanceResponseData)
        })

        afterEach(() => {
          vi.mocked(errors.warning).mockRestore()
          vi.useRealTimers()
          if (oldIntervals === undefined) {
            delete process.env.API_RETRY_INTERVALS
          } else {
            process.env.API_RETRY_INTERVALS = oldIntervals
          }
        })

        if (label === AXIOS_LABEL) {
          it('throws an aggregate error', async () => {
            const p = createInstance(runId, instanceRequestData, timeout)

            await runAllTimersUntilSettled(p)

            try {
              await p
              throw new Error('should have thrown here')
            } catch (err) {
              if (err instanceof Error && err.message === 'should have thrown here') {
                throw err
              }

              const aggregate = err as AggregateError

              expect(aggregate.errors).toBeDefined()
              for (const error of aggregate.errors) {
                expect(error.message).toBe(`timeout of ${timeout}ms exceeded`)
                expect((error as Error & { isApiError?: boolean }).isApiError).toBe(true)
              }
            }
          })
        } else {
          it('throws a tagged error', async () => {
            const p = createInstance(runId, instanceRequestData, timeout)

            await runAllTimersUntilSettled(p)

            let thrown: Error | undefined

            try {
              await p
            } catch (e) {
              thrown = e as Error
            }

            expect(thrown).toBeDefined()
            expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
          })
        }
      })

      describe('when the request times out once and then succeeds', () => {
        beforeEach(() => {
          vi.spyOn(errors, 'warning').mockImplementation(() => null)
          nocked.delayConnection(5000).reply(200, instanceResponseData)
          nocked.delayConnection(0).reply(200, instanceResponseData)
          if (label === REQUEST_LABEL) {
            vi.useFakeTimers()
          }
        })

        afterEach(() => {
          vi.mocked(errors.warning).mockRestore()
          if (label === REQUEST_LABEL) {
            vi.useRealTimers()
          }
        })

        it('returns the instance response data', async () => {
          if (label === AXIOS_LABEL) {
            // Real timers: under fake timers, a single `advanceTimers*` / `runAllTimers*` batch can let
            // nock’s `delayConnection(5000)` complete before axios’s shorter request timeout, so the
            // wrong interceptor is consumed (see Vitest [timers guide](https://vitest.dev/guide/mocking/timers)).
            const data = await createInstance(runId, instanceRequestData, 100)

            expect(data).toEqual(instanceResponseData)

            return
          }

          const p = createInstance(runId, instanceRequestData, 100)

          await runAllTimersUntilSettled(p)

          const data = await p

          expect(data).toEqual(instanceResponseData)
        })
      })
    })
  })
})
