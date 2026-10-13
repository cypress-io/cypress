import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureStudioBundle } from '../../../../lib/cloud/studio/ensure_studio_bundle'

const { ensureSignedBundleStub } = vi.hoisted(() => {
  return { ensureSignedBundleStub: vi.fn() }
})

vi.mock('../../../../lib/cloud/bundles/ensure_signed_bundle', () => {
  return { ensureSignedBundle: ensureSignedBundleStub }
})

describe('ensureStudioBundle', () => {
  beforeEach(() => {
    ensureSignedBundleStub.mockReset()
  })

  it('delegates to ensureSignedBundle with kind=studio and unwraps the bundleDir', async () => {
    const mockManifest = { 'server/index.js': 'abc123' }
    const mockBundleDir = '/cache/bundles/studio/abc'

    ensureSignedBundleStub.mockResolvedValue({
      manifest: mockManifest,
      bundleDir: mockBundleDir,
    })

    const result = await ensureStudioBundle({
      studioUrl: 'https://cdn.cypress.io/studio/abc.tar',
      projectId: 'proj-1',
    })

    expect(ensureSignedBundleStub).toHaveBeenCalledOnce()
    expect(ensureSignedBundleStub).toHaveBeenCalledWith({
      url: 'https://cdn.cypress.io/studio/abc.tar',
      projectId: 'proj-1',
      kind: 'studio',
    })

    expect(result).toStrictEqual({
      manifest: mockManifest,
      studioPath: mockBundleDir,
    })
  })

  it('forwards an undefined projectId without injecting one', async () => {
    ensureSignedBundleStub.mockResolvedValue({ manifest: {}, bundleDir: '/cache/bundles/studio/x' })

    await ensureStudioBundle({ studioUrl: 'https://cdn.cypress.io/studio/x.tar' })

    expect(ensureSignedBundleStub.mock.calls).toStrictEqual([[{
      url: 'https://cdn.cypress.io/studio/x.tar',
      projectId: undefined,
      kind: 'studio',
    }]])
  })

  it('propagates errors from ensureSignedBundle', async () => {
    const err = new Error('boom')

    ensureSignedBundleStub.mockRejectedValue(err)

    await expect(ensureStudioBundle({ studioUrl: 'https://cdn.cypress.io/studio/abc.tar' }))
    .rejects.toBe(err)
  })
})
