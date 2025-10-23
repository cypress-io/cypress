import { describe, expect, it, vi } from 'vitest'
import { HttpMiddlewareThis } from '../../../../lib/http'
import { doesTopNeedToBeSimulated } from '../../../../lib/http/util/top-simulation'

describe('.doesTopNeedToBeSimulated', () => {
  const autUrl = 'http://localhost:8080'

  it('returns false when URL matches the AUT Url origin and the AUT Url exists and is NOT the AUT frame', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: vi.fn().mockReturnValue(autUrl),
      req: {
        isAUTFrame: false,
      },
      remoteStates: {
        isPrimarySuperDomainOrigin: vi.fn().mockReturnValue(true),
      },
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).toBe(false)
  })

  /**
   * We want to make an exception for the AUT Frame to attach/set cookies as redirects could have set cookies in the browsers which would later be attached
   *
   * If this proves problematic in the future, we can likely leverage the sec-fetch-mode header for requests and 3xx status for responses to determine
   * whether or not cookies need to be attached from the jar or set into the jar
   */
  it('returns true when URL matches the AUT Url origin and the AUT Url exists and is the AUT frame', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: vi.fn().mockReturnValue(autUrl),
      req: {
        isAUTFrame: true,
      },
      remoteStates: {
        isPrimarySuperDomainOrigin: vi.fn().mockReturnValue(true),
      },
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).toBe(true)
  })

  it('returns false when AUT Url is  not defined, regardless of primary origin stack', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: vi.fn().mockReturnValue(undefined),
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).toBe(false)
  })

  it('returns true when AUT Url is defined but AUT Url no longer matches the primary origin', () => {
    const mockCtx: HttpMiddlewareThis<any> = {
      getAUTUrl: vi.fn().mockReturnValue(autUrl),
      remoteStates: {
        isPrimarySuperDomainOrigin: vi.fn().mockReturnValue(false),
      },
    }

    expect(doesTopNeedToBeSimulated(mockCtx)).toBe(true)
  })
})
