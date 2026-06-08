import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProxyResponseInterceptionAdapter } from '../../../lib/adapters/proxy-response-interception'
import { handleInterceptResponse } from '@packages/net-stubbing'

vi.mock('@packages/net-stubbing', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@packages/net-stubbing')>()

  return {
    ...actual,
    handleInterceptResponse: vi.fn(),
  }
})

describe('ProxyResponseInterceptionAdapter', () => {
  beforeEach(() => {
    vi.mocked(handleInterceptResponse).mockReset()
  })

  it('delegates interceptResponse to handleInterceptResponse', async () => {
    const adapter = new ProxyResponseInterceptionAdapter()
    const ctx = { req: { requestId: 'req-1' } }

    vi.mocked(handleInterceptResponse).mockResolvedValue(undefined)

    await adapter.interceptResponse(ctx)

    expect(handleInterceptResponse).toHaveBeenCalledOnce()
    expect(handleInterceptResponse).toHaveBeenCalledWith(ctx)
  })
})
