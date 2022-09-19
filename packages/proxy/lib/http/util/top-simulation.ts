import { urlOriginsMatch, urlSameSiteMatch } from '@packages/network/lib/cors'
import type { HttpMiddlewareThis } from '../index'
import type { SecFetchSite } from '../../types'

export const doesTopNeedToBeSimulated = <T>(ctx: HttpMiddlewareThis<T>): boolean => {
  const currentAUTUrl = ctx.getAUTUrl()

  // if the AUT url is undefined for whatever reason, return false as we do not want to complicate top simulation
  if (!currentAUTUrl) {
    return false
  }

  // only simulate top if the AUT is NOT the primary origin, meaning that we should treat the AUT as top
  // or the request is the AUT frame, which is common for redirects and navigations.
  const doesTopNeedToSimulating = !ctx.remoteStates.isPrimaryOrigin(currentAUTUrl) || ctx.req.isAUTFrame

  return doesTopNeedToSimulating
}

// @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site
export const calculateSiteContext = (url1: string, url2: string, isUserInteraction = false): SecFetchSite => {
  if (urlOriginsMatch(url1, url2)) {
    return 'same-origin'
  }

  if (urlSameSiteMatch(url1, url2)) {
    return 'same-site'
  }

  return isUserInteraction ? 'none' : 'cross-site'
}
