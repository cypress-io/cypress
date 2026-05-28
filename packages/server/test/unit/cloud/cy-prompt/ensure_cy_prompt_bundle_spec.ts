import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureCyPromptBundle', () => {
  let ensureCyPromptBundle: typeof import('../../../../lib/cloud/cy-prompt/ensure_cy_prompt_bundle').ensureCyPromptBundle
  let ensureSignedBundleStub: sinon.SinonStub

  beforeEach(() => {
    ensureSignedBundleStub = sinon.stub()

    ensureCyPromptBundle = (proxyquire('../lib/cloud/cy-prompt/ensure_cy_prompt_bundle', {
      '../bundles/ensure_signed_bundle': {
        ensureSignedBundle: ensureSignedBundleStub,
      },
    })).ensureCyPromptBundle
  })

  it('delegates to ensureSignedBundle with kind=cy-prompt and unwraps the bundleDir', async () => {
    const mockManifest = { 'server/index.js': 'abc123' }
    const mockBundleDir = '/cache/bundles/cy-prompt/abc'

    ensureSignedBundleStub.resolves({
      manifest: mockManifest,
      bundleDir: mockBundleDir,
    })

    const result = await ensureCyPromptBundle({
      cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/abc.tar',
      projectId: 'proj-1',
    })

    expect(ensureSignedBundleStub).to.be.calledOnce
    expect(ensureSignedBundleStub).to.be.calledWith({
      url: 'https://cdn.cypress.io/cy-prompt/abc.tar',
      projectId: 'proj-1',
      kind: 'cy-prompt',
    })

    expect(result).to.deep.equal({
      manifest: mockManifest,
      cyPromptPath: mockBundleDir,
    })
  })

  it('forwards an undefined projectId without injecting one', async () => {
    ensureSignedBundleStub.resolves({ manifest: {}, bundleDir: '/cache/bundles/cy-prompt/x' })

    await ensureCyPromptBundle({ cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/x.tar' })

    expect(ensureSignedBundleStub).to.be.calledWith({
      url: 'https://cdn.cypress.io/cy-prompt/x.tar',
      projectId: undefined,
      kind: 'cy-prompt',
    })
  })

  it('propagates errors from ensureSignedBundle', async () => {
    const err = new Error('boom')

    ensureSignedBundleStub.rejects(err)

    await expect(ensureCyPromptBundle({ cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/abc.tar' }))
    .to.be.rejectedWith(err)
  })
})
