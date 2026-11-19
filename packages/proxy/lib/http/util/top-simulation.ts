import type { HttpMiddlewareThis } from '../index'

export const doesTopNeedToBeSimulated = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  const currentAUTUrl = ctx.getAUTUrl()

  // if the AUT url is undefined for whatever reason, return false as we do not want to complicate top simulation
  if (!currentAUTUrl) {
    return false
  }

  // only simulate top if the AUT is NOT the primary super domain origin, meaning that we should treat the AUT as top
  // or the request is the AUT frame, which is common for redirects and navigations.
  return !ctx.remoteStates.isPrimarySuperDomainOrigin(currentAUTUrl) || ctx.req.isAUTFrame
}

const sameSiteFetchSites = ['same-origin', 'same-site']

// Firefox withholds SameSite cookies from a navigation another origin started or that was
// redirected through one, and says so in Sec-Fetch-Site. Chromium sends them regardless.
const doesBrowserWithholdSameSiteCookies = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  if (ctx.getCurrentBrowser()?.family === 'chromium') {
    return false
  }

  const secFetchSite = ctx.req.headers['sec-fetch-site']

  return typeof secFetchSite !== 'string' || !sameSiteFetchSites.includes(secFetchSite)
}

// The jar never sees a native `document.cookie` write, so its copy can be stale. The
// browser's own Cookie header is complete for an AUT frame navigation within the primary origin.
export const doesBrowserSendAllCookies = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  const currentAUTUrl = ctx.getAUTUrl()

  return !!currentAUTUrl
    && ctx.req.isAUTFrame
    && ctx.remoteStates.isPrimarySuperDomainOrigin(currentAUTUrl)
    && ctx.remoteStates.isPrimarySuperDomainOrigin(ctx.req.proxiedUrl)
    && !doesBrowserWithholdSameSiteCookies(ctx)
}
