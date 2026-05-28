import { proxyquire, sinon } from '../../../spec_helper'

describe('ensureStudioBundle', () => {
  let ensureStudioBundle: typeof import('../../../../lib/cloud/studio/ensure_studio_bundle').ensureStudioBundle
  let ensureSignedBundleStub: sinon.SinonStub

  beforeEach(() => {
    ensureSignedBundleStub = sinon.stub()

    ensureStudioBundle = (proxyquire('../lib/cloud/studio/ensure_studio_bundle', {
      '../bundles/ensure_signed_bundle': {
        ensureSignedBundle: ensureSignedBundleStub,
      },
    })).ensureStudioBundle
  })

  it('delegates to ensureSignedBundle with kind=studio and unwraps the bundleDir', async () => {
    const mockManifest = { 'server/index.js': 'abc123' }
    const mockBundleDir = '/cache/bundles/studio/abc'

    ensureSignedBundleStub.resolves({
      manifest: mockManifest,
      bundleDir: mockBundleDir,
    })

    const result = await ensureStudioBundle({
      studioUrl: 'https://cdn.cypress.io/studio/abc.tar',
      projectId: 'proj-1',
    })

    expect(ensureSignedBundleStub).to.be.calledOnce
    expect(ensureSignedBundleStub).to.be.calledWith({
      url: 'https://cdn.cypress.io/studio/abc.tar',
      projectId: 'proj-1',
      kind: 'studio',
    })

    expect(result).to.deep.equal({
      manifest: mockManifest,
      studioPath: mockBundleDir,
    })
  })

  it('forwards an undefined projectId without injecting one', async () => {
    ensureSignedBundleStub.resolves({ manifest: {}, bundleDir: '/cache/bundles/studio/x' })

    await ensureStudioBundle({ studioUrl: 'https://cdn.cypress.io/studio/x.tar' })

    expect(ensureSignedBundleStub).to.be.calledWith({
      url: 'https://cdn.cypress.io/studio/x.tar',
      projectId: undefined,
      kind: 'studio',
    })
  })

  it('propagates errors from ensureSignedBundle', async () => {
    const err = new Error('boom')

    ensureSignedBundleStub.rejects(err)

    await expect(ensureStudioBundle({ studioUrl: 'https://cdn.cypress.io/studio/abc.tar' }))
    .to.be.rejectedWith(err)
  })
})
