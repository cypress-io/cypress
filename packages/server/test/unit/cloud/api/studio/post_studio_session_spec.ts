import { SystemError } from '../../../../../lib/cloud/network/system_error'
import { proxyquire } from '../../../../spec_helper'
import os from 'os'
import pkg from '@packages/root'
import { ParseKinds } from '../../../../../lib/cloud/network/fetch'
import sinon from 'sinon'

describe('postStudioSession', () => {
  let postStudioSession: typeof import('@packages/server/lib/cloud/api/studio/post_studio_session').postStudioSession
  let postFetchStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    postFetchStub.reset()
    postStudioSession = (proxyquire('@packages/server/lib/cloud/api/studio/post_studio_session', {
      '../../network/fetch': {
        postFetch: postFetchStub,
      },
    }) as typeof import('@packages/server/lib/cloud/api/studio/post_studio_session')).postStudioSession
  })

  it('should post a studio session', async () => {
    postFetchStub.resolves({
      studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
      protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
    })

    const result = await postStudioSession({
      projectId: '12345',
    })

    expect(result).to.deep.equal({
      studioUrl: 'http://localhost:1234/studio/bundle/abc.tgz',
      protocolUrl: 'http://localhost:1234/capture-protocol/script/def.js',
    })

    expect(postFetchStub).to.have.been.calledOnce
    expect(postFetchStub).to.have.been.calledWith(
      'http://localhost:1234/studio/session',
      {
        parse: ParseKinds.JSON,
        headers: {
          'Content-Type': 'application/json',
          'x-os-name': os.platform(),
          'x-cypress-version': pkg.version,
        },
        body: JSON.stringify({ projectSlug: '12345', studioMountVersion: 1, protocolMountVersion: 2 }),
      },
    )
  })

  it('should throw an error if we receive a retryable error more than twice', async () => {
    postFetchStub.rejects(new SystemError(new Error('Failed to create studio session'), 'http://localhost:1234/studio/session', 'ECONNRESET', 100))

    await expect(postStudioSession({
      projectId: '12345',
    })).to.be.rejected

    expect(postFetchStub).to.have.been.calledThrice
  })
})
