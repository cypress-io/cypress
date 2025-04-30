import { SystemError } from '../../../../../lib/cloud/network/system_error'
import { proxyquire } from '../../../../spec_helper'
import os from 'os'
import { agent } from '@packages/network'
import pkg from '@packages/root'

describe('postStudioSession', () => {
  let postStudioSession: typeof import('@packages/server/lib/cloud/api/studio/post_studio_session').postStudioSession
  let crossFetchStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    crossFetchStub.reset()
    postStudioSession = (proxyquire('@packages/server/lib/cloud/api/studio/post_studio_session', {
      'cross-fetch': crossFetchStub,
    }) as typeof import('@packages/server/lib/cloud/api/studio/post_studio_session')).postStudioSession
  })

  it('should post a studio session', async () => {
    crossFetchStub.resolves({
      ok: true,
      json: () => {
        return Promise.resolve({
          studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
          protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
        })
      },
    })

    const result = await postStudioSession({
      projectId: '12345',
    })

    expect(result).to.deep.equal({
      studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
      protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
    })

    expect(crossFetchStub).to.have.been.calledOnce
    expect(crossFetchStub).to.have.been.calledWith(
      'http://localhost:1234/studio/session',
      {
        method: 'POST',
        agent,
        headers: {
          'Content-Type': 'application/json',
          'x-os-name': os.platform(),
          'x-cypress-version': pkg.version,
        },
        body: JSON.stringify({ projectSlug: '12345', studioMountVersion: 1, protocolMountVersion: 2 }),
      },
    )
  })

  it('should throw immediately if the response is not ok', async () => {
    crossFetchStub.resolves({
      ok: false,
      json: () => {
        return Promise.resolve({
          error: 'Failed to create studio session',
        })
      },
    })

    await expect(postStudioSession({
      projectId: '12345',
    })).to.be.rejectedWith('Failed to create studio session')

    expect(crossFetchStub).to.have.been.calledOnce
  })

  it('should throw an error if we receive a retryable error more than twice', async () => {
    crossFetchStub.rejects(new SystemError(new Error('Failed to create studio session'), 'http://localhost:1234/studio/session'))

    await expect(postStudioSession({
      projectId: '12345',
    })).to.be.rejected

    expect(crossFetchStub).to.have.been.calledThrice
  })
})
