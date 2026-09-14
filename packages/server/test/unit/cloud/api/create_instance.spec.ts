import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import pkg from '@packages/root'

import type { CreateInstanceRequestBody, CreateInstanceResponse } from '../../../../lib/cloud/api/create_instance'
import { createInstance as axiosCreateInstance } from '../../../../lib/cloud/api/create_instance'
import api from '../../../../lib/cloud/api'

const API_BASEURL = 'http://localhost:1234'
const OS_PLATFORM = 'linux'

const AXIOS_LABEL = 'axios createInstance'
const REQUEST_LABEL = 'request createInstance'

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
            expect(instanceResponseData[k]).toBe(response[k])
          }
        })
      })

      describe('when the request times out 4 times', () => {
        const timeout = 10
        let oldIntervals: string | undefined

        beforeEach(() => {
          oldIntervals = process.env.API_RETRY_INTERVALS
          process.env.API_RETRY_INTERVALS = '0,0,0'
          nocked
          .times(4)
          .delayConnection(5000)
          .reply(200, instanceResponseData)
        })

        afterEach(() => {
          if (oldIntervals === undefined) {
            delete process.env.API_RETRY_INTERVALS
          } else {
            process.env.API_RETRY_INTERVALS = oldIntervals
          }
        })

        // axios throws an AggregateError
        if (AXIOS_LABEL === label) {
          it('throws an aggregate error', async () => {
            let thrown: AggregateError | undefined = undefined

            try {
              await createInstance(runId, instanceRequestData, timeout)
            } catch (e) {
              thrown = e
            }

            expect(thrown, 'should have thrown here').not.toBeUndefined()

            for (const error of (thrown as AggregateError).errors) {
              expect(error.message).toBe(`timeout of ${timeout}ms exceeded`)
              expect(error.isApiError).toBe(true)
            }
          })
        // request/promise throws the most recent error
        } else {
          it('throws a tagged error', async () => {
            let thrown: Error | undefined = undefined

            try {
              await createInstance(runId, instanceRequestData, timeout)
            } catch (e) {
              thrown = e
            }

            expect(thrown).not.toBeUndefined()
            expect((thrown as Error & { isApiError?: boolean }).isApiError).toBe(true)
          })
        }
      })

      describe('when the request times out once and then succeeds', () => {
        beforeEach(() => {
          nocked.delayConnection(5000).reply(200, instanceResponseData)
          nocked.delayConnection(0).reply(200, instanceResponseData)
        })

        it('returns the instance response data', async () => {
          const data = await createInstance(runId, instanceRequestData, 100)

          expect(data).toEqual(instanceResponseData)
        })
      })
    })
  })
})
