import chai from 'chai'
import nock from 'nock'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import os from 'os'
import pkg from '@packages/root'

import { createInstance } from '../../../../lib/cloud/api/create_instance'

chai.use(sinonChai)

const { expect } = chai

const API_BASEURL = 'http://localhost:1234'
const OS_PLATFORM = 'linux'

context('API createInstance', () => {
  let nocked
  const runId = 'run-id-123'

  const instanceRequestData: Parameters<typeof createInstance>[1] = {
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

  const instanceResponseData: Awaited<ReturnType<typeof createInstance>> = {
    instanceId: 'instance-id-123',
    claimedInstances: 0,
    estimatedWallClockDuration: null,
    spec: null,
    totalInstances: 0,
  }

  beforeEach(() => {
    nocked = nock(API_BASEURL)
    .matchHeader('x-cypress-run-id', runId)
    // sinon stubbing on the `os` package doesn't work for `createInstance`
    //.matchHeader('x-os-name', OS_PLATFORM)
    .matchHeader('x-cypress-version', pkg.version)
    .post(`/runs/${runId}/instances`)

    sinon.stub(os, 'platform').returns(OS_PLATFORM)
  })

  afterEach(() => {
    (os.platform as sinon.SinonStub).restore()
  })

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

  describe('when the request times out 3 times', () => {
    const timeout = 100

    beforeEach(() => {
      nocked
      .times(3)
      .delayConnection(5000)
      .reply(200, instanceResponseData)
    })

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
