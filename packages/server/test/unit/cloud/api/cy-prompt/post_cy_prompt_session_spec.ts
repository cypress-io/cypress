import { SystemError } from '../../../../../lib/cloud/network/system_error'
import { proxyquire } from '../../../../spec_helper'
import { ParseKinds } from '../../../../../lib/cloud/network/fetch'
import sinon from 'sinon'

const standardHeaders = {
  'x-os-name': 'test-os',
  'x-cypress-version': 'test-version',
  'x-machine-id': 'test-machine-id',
}

describe('postCyPromptSession', () => {
  let postCyPromptSession: typeof import('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session').postCyPromptSession
  let postFetchStub: sinon.SinonStub = sinon.stub()

  beforeEach(() => {
    postFetchStub.reset()
    postCyPromptSession = (proxyquire('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session', {
      '../../network/fetch': {
        postFetch: postFetchStub,
      },
      '../get_standard_headers': {
        getStandardHeaders: sinon.stub().resolves(standardHeaders),
      },
    }) as typeof import('@packages/server/lib/cloud/api/cy-prompt/post_cy_prompt_session')).postCyPromptSession
  })

  it('should post a cy-prompt session', async () => {
    postFetchStub.resolves({
      cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz',
    })

    const result = await postCyPromptSession({
      projectId: '12345',
    })

    expect(result).to.deep.equal({
      cyPromptUrl: 'http://localhost:1234/cy-prompt/bundle/abc.tgz',
    })

    expect(postFetchStub).to.have.been.calledOnce
    expect(postFetchStub).to.have.been.calledWith(
      'http://localhost:1234/cy-prompt/session',
      {
        parse: ParseKinds.JSON,
        headers: {
          'Content-Type': 'application/json',
          ...standardHeaders,
        },
        body: JSON.stringify({ projectSlug: '12345', cyPromptMountVersion: 2 }),
      },
    )
  })

  it('should throw an error if we receive a retryable error more than twice', async () => {
    postFetchStub.rejects(new SystemError(new Error('Failed to create cy-prompt session'), 'http://localhost:1234/cy-prompt/session', 'ECONNRESET', 100))

    await expect(postCyPromptSession({
      projectId: '12345',
    })).to.be.rejected

    expect(postFetchStub).to.have.been.calledThrice
  })
})
