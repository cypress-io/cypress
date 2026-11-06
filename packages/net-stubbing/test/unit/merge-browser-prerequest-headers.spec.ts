import { describe, it, expect } from 'vitest'
import type { CypressIncomingRequest } from '@packages/proxy'
import { mergeMissingHeadersFromBrowserPreRequest } from '../../lib/server/merge-browser-prerequest-headers'

describe('mergeMissingHeadersFromBrowserPreRequest', () => {
  it('fills in Content-Type from browser pre-request when absent on req.headers', () => {
    const req = {
      headers: {
        'accept': '*/*',
      },
      browserPreRequest: {
        requestId: '1',
        method: 'POST',
        url: 'http://localhost:3500/post-only',
        headers: {
          'Content-Type': 'application/json',
        },
        resourceType: 'xhr' as const,
        originalResourceType: 'xhr',
      },
    } as unknown as CypressIncomingRequest

    mergeMissingHeadersFromBrowserPreRequest(req)

    expect(req.headers['content-type']).to.eq('application/json')
  })

  it('does not overwrite an existing content-type', () => {
    const req = {
      headers: {
        'content-type': 'text/plain',
      },
      browserPreRequest: {
        requestId: '1',
        method: 'POST',
        url: 'http://localhost:3500/post-only',
        headers: {
          'Content-Type': 'application/json',
        },
        resourceType: 'xhr' as const,
        originalResourceType: 'xhr',
      },
    } as unknown as CypressIncomingRequest

    mergeMissingHeadersFromBrowserPreRequest(req)

    expect(req.headers['content-type']).to.eq('text/plain')
  })
})
