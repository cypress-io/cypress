import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureCyPromptBundle } from '../../../../lib/cloud/cy-prompt/ensure_cy_prompt_bundle'

const { ensureSignedBundleStub } = vi.hoisted(() => {
  return { ensureSignedBundleStub: vi.fn() }
})

vi.mock('../../../../lib/cloud/bundles/ensure_signed_bundle', () => {
  return { ensureSignedBundle: ensureSignedBundleStub }
})

describe('ensureCyPromptBundle', () => {
  beforeEach(() => {
    ensureSignedBundleStub.mockReset()
  })

  it('delegates to ensureSignedBundle with kind=cy-prompt and unwraps the bundleDir', async () => {
    const mockManifest = { 'server/index.js': 'abc123' }
    const mockBundleDir = '/cache/bundles/cy-prompt/abc'

    ensureSignedBundleStub.mockResolvedValue({
      manifest: mockManifest,
      bundleDir: mockBundleDir,
    })

    const result = await ensureCyPromptBundle({
      cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/abc.tar',
      projectId: 'proj-1',
    })

    expect(ensureSignedBundleStub).toHaveBeenCalledOnce()
    expect(ensureSignedBundleStub).toHaveBeenCalledWith({
      url: 'https://cdn.cypress.io/cy-prompt/abc.tar',
      projectId: 'proj-1',
      kind: 'cy-prompt',
    })

    expect(result).toStrictEqual({
      manifest: mockManifest,
      cyPromptPath: mockBundleDir,
    })
  })

  it('forwards an undefined projectId without injecting one', async () => {
    ensureSignedBundleStub.mockResolvedValue({ manifest: {}, bundleDir: '/cache/bundles/cy-prompt/x' })

    await ensureCyPromptBundle({ cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/x.tar' })

    expect(ensureSignedBundleStub).toHaveBeenCalledWith({
      url: 'https://cdn.cypress.io/cy-prompt/x.tar',
      projectId: undefined,
      kind: 'cy-prompt',
    })
  })

  it('propagates errors from ensureSignedBundle', async () => {
    const err = new Error('boom')

    ensureSignedBundleStub.mockRejectedValue(err)

    await expect(ensureCyPromptBundle({ cyPromptUrl: 'https://cdn.cypress.io/cy-prompt/abc.tar' }))
    .rejects.toBe(err)
  })
})
