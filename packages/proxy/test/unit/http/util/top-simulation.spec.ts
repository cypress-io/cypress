import { describe, expect, it, vi } from 'vitest'
import type { HttpMiddlewareThis } from '../../../../lib/http'
import { doesBrowserSendAllCookies, doesTopNeedToBeSimulated } from '../../../../lib/http/util/top-simulation'

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

describe('.doesBrowserSendAllCookies', () => {
  const primaryUrl = 'http://localhost:8080/dashboard'
  const crossOriginUrl = 'http://www.idp.com:8081/authorize'

  const getCtx = ({ autUrl, requestUrl, isAUTFrame = true, secFetchSite = 'same-origin', browserFamily = 'firefox' }: { autUrl?: string, requestUrl: string, isAUTFrame?: boolean, secFetchSite?: string, browserFamily?: string }): HttpMiddlewareThis<any> => {
    return {
      getAUTUrl: vi.fn().mockReturnValue(autUrl),
      getCurrentBrowser: vi.fn().mockReturnValue(browserFamily ? { family: browserFamily } : undefined),
      req: {
        isAUTFrame,
        proxiedUrl: requestUrl,
        headers: secFetchSite ? { 'sec-fetch-site': secFetchSite } : {},
      },
      remoteStates: {
        isPrimarySuperDomainOrigin: vi.fn((url: string) => url.startsWith('http://localhost:8080')),
      },
    }
  }

  it.each(['same-origin', 'same-site'])('returns true when the AUT frame navigates within the primary origin and sec-fetch-site is %s', (secFetchSite) => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/settings', secFetchSite }))).toBe(true)
  })

  it.each(['cross-site', 'none', 'same-origin, cross-site'])('returns false when sec-fetch-site is %s', (secFetchSite) => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/callback', secFetchSite }))).toBe(false)
  })

  it('returns false when a browser other than Chromium does not send sec-fetch-site', () => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/settings', secFetchSite: '' }))).toBe(false)
  })

  it('returns false when there is no current browser and no sec-fetch-site', () => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/settings', secFetchSite: '', browserFamily: '' }))).toBe(false)
  })

  it.each(['', 'cross-site'])('returns true in a Chromium browser when sec-fetch-site is "%s"', (secFetchSite) => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/callback', secFetchSite, browserFamily: 'chromium' }))).toBe(true)
  })

  it('returns false when the AUT frame navigates to another origin', () => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: crossOriginUrl }))).toBe(false)
  })

  it('returns false when the AUT frame navigates back to the primary origin from another origin', () => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: crossOriginUrl, requestUrl: primaryUrl }))).toBe(false)
  })

  it('returns false when the request is not from the AUT frame', () => {
    expect(doesBrowserSendAllCookies(getCtx({ autUrl: primaryUrl, requestUrl: 'http://localhost:8080/api/users', isAUTFrame: false }))).toBe(false)
  })

  it('returns false when the AUT Url is not defined', () => {
    expect(doesBrowserSendAllCookies(getCtx({ requestUrl: primaryUrl }))).toBe(false)
  })
})
