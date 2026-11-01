import Debug from 'debug'
import bodyParser from 'body-parser'
import type { Request, Router } from 'express'
import type { NetworkProxy } from '@packages/proxy'
import type { RemoteUncaughtException } from '@packages/types'
import { cookieJar, toughCookieToAutomationCookie, automationCookieToToughCookie } from './automation/cookie/jar'
import type { SerializableAutomationCookie } from './automation/cookie/jar'

const debug = Debug('cypress:server:remote-aut-routes')

const isHttpUrl = (url: unknown) => {
  try {
    return ['http:', 'https:'].includes(new URL(String(url)).protocol)
  } catch (err) {
    return false
  }
}

interface RemoteAutRouteOptions {
  namespace: string
  getNetworkProxy: () => NetworkProxy | undefined
  setBrowserCookie: (cookie: SerializableAutomationCookie) => Promise<unknown>
  reportAutError: (uncaught: RemoteUncaughtException) => Promise<unknown>
}

// The routes the remote driver's main-world AUT script calls to make a cross-origin page behave as if
// it were top-level, in place of the postMessage the legacy cross-origin injection sends to the runner.
export const addRemoteAutRoutes = (router: Router, { namespace, getNetworkProxy, setBrowserCookie, reportAutError }: RemoteAutRouteOptions) => {
  // a page only reaches the cookies of its own origin, as it could as top
  const getPageUrl = (req: Request & { proxiedUrl?: string }, url: unknown) => {
    try {
      const requestOrigin = new URL(req.proxiedUrl ?? `${req.protocol}://${req.get('host')}`).origin
      const pageUrl = new URL(String(url))

      return pageUrl.origin === requestOrigin ? pageUrl : undefined
    } catch (err) {
      return undefined
    }
  }

  router.get(`/${namespace}/remote/cookies`, (req, res) => {
    const pageUrl = getPageUrl(req, req.query.url)

    if (!pageUrl) {
      return res.sendStatus(403)
    }

    const cookies = cookieJar.getCookies(pageUrl.href)
    .filter((cookie) => !cookie.httpOnly)
    .map((cookie) => toughCookieToAutomationCookie(cookie, pageUrl.hostname))

    return res.json(cookies)
  })

  router.post(`/${namespace}/remote/credentials`, bodyParser.json(), (req, res) => {
    // the url is the request the page is about to make, which can be on any origin
    const { url, resourceType, credentialStatus } = req.body ?? {}

    if (!isHttpUrl(url) || !['xhr', 'fetch'].includes(resourceType)) {
      return res.sendStatus(400)
    }

    getNetworkProxy()?.setCredentials({ url, resourceType, credentialStatus })

    return res.sendStatus(204)
  })

  // the page waits on the reply, so the error reaches the driver before a later round trip to the page returns
  router.post(`/${namespace}/remote/uncaught`, bodyParser.json(), async (req, res) => {
    const { handlerType, error } = req.body ?? {}

    if (!['error', 'unhandledrejection'].includes(handlerType) || typeof error?.message !== 'string') {
      return res.sendStatus(400)
    }

    await reportAutError({
      handlerType,
      error: {
        name: typeof error.name === 'string' ? error.name : undefined,
        message: error.message,
        stack: typeof error.stack === 'string' ? error.stack : undefined,
      },
    }).catch((err) => {
      debug('failed to report the AUT\'s error: %o', err)
    })

    return res.sendStatus(204)
  })

  router.post(`/${namespace}/remote/set-cookie`, bodyParser.json(), async (req, res) => {
    const { cookie, url } = req.body ?? {}
    const pageUrl = getPageUrl(req, url)

    if (!pageUrl || !cookie) {
      return res.sendStatus(400)
    }

    try {
      // url always matches the cookie's domain, so a strict context lets tough-cookie set it
      cookieJar.setCookie(automationCookieToToughCookie(cookie, pageUrl.hostname), pageUrl.href, 'strict')
    } catch (err) {
      debug('not setting a cookie the page could not set as top: %o', err)

      return res.sendStatus(204)
    }

    await setBrowserCookie(cookie).catch((err) => {
      debug('failed to set the page\'s cookie in the browser: %o', err)
    })

    return res.sendStatus(204)
  })
}
