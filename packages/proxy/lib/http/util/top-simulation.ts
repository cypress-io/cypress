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

const sameSiteFetchSites = ['same-origin', 'same-site', 'none']

// A navigation started from another origin, or redirected through one, can be cross-site
// to the browser even when it ends on the primary origin, and so can a reload of that page.
// Firefox withholds SameSite cookies from those, which Sec-Fetch-Site reports. Chromium
// does not, and its header is absent from natively intercepted requests.
const isSameSiteNavigation = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  const secFetchSite = ctx.req.headers['sec-fetch-site']

  if (typeof secFetchSite === 'string') {
    return sameSiteFetchSites.includes(secFetchSite)
  }

  return ctx.getCurrentBrowser()?.family === 'chromium'
}

// When the AUT frame makes a same-site navigation within the primary origin, the browser
// sends every cookie it holds. The jar never sees a native `document.cookie` write, so
// its copy can be stale.
export const doesBrowserSendAllCookies = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  const currentAUTUrl = ctx.getAUTUrl()

  return !!currentAUTUrl
    && ctx.req.isAUTFrame
    && ctx.remoteStates.isPrimarySuperDomainOrigin(currentAUTUrl)
    && ctx.remoteStates.isPrimarySuperDomainOrigin(ctx.req.proxiedUrl)
    && isSameSiteNavigation(ctx)
}
