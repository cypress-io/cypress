import chai from 'chai'
import nock from 'nock'
import sinonChai from 'sinon-chai'
import pkg from '@packages/root'

import { createInstance as axiosCreateInstance, CreateInstanceRequestBody, CreateInstanceResponse } from '../../../../lib/cloud/api/create_instance'
import api from '../../../../lib/cloud/api'

chai.use(sinonChai)

const { expect } = chai

const API_BASEURL = 'http://localhost:1234'
const OS_PLATFORM = 'linux'

const AXIOS_LABEL = 'axios createInstance'
const REQUEST_LABEL = 'request createInstance'

context('API createInstance', () => {
  let nocked
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
    nocked = nock(API_BASEURL)
    .matchHeader('x-cypress-run-id', runId)
    .matchHeader('x-cypress-version', pkg.version)
    .post(`/runs/${runId}/instances`)

    api.setPreflightResult({ encrypt: false })
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
  ].forEach(function ({ label, fn: createInstance }) {
    describe(label, function () {
      describe('when the request succeeds', () => {
        beforeEach(() => {
          nocked.reply(200, instanceResponseData)
        })

        it('returns the created instance', async () => {
          const response = await createInstance(runId, instanceRequestData)

          for (let k in instanceResponseData) {
            expect(instanceResponseData[k]).to.eq(response[k])
          }
        })
      })

      describe('when the request times out 4 times', () => {
        const timeout = 10
        let oldIntervals

        beforeEach(() => {
          oldIntervals = process.env.API_RETRY_INTERVALS
          process.env.API_RETRY_INTERVALS = '0,0,0'
          nocked
          .times(4)
          .delayConnection(5000)
          .reply(200, instanceResponseData)
        })

        afterEach(() => {
          process.env.API_RETRY_INTERVALS = oldIntervals
        })

        // axios throws an AggregateError
        if (AXIOS_LABEL === label) {
          it('throws an aggregate error', () => {
            return createInstance(runId, instanceRequestData, timeout)
            .then(() => {
              throw new Error('should have thrown here')
            }).catch((err) => {
              for (const error of err.errors) {
                expect(error.message).to.eq(`timeout of ${timeout}ms exceeded`)
                expect(error.isApiError).to.be.true
              }
            })
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

            expect(thrown).not.to.be.undefined
            expect((thrown as Error & { isApiError?: boolean }).isApiError).to.be.true
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

          expect(data).to.deep.eq(instanceResponseData)
        })
      })
    })
  })
})
