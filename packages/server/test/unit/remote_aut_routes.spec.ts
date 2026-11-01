import type { AddressInfo } from 'net'
import type { Server } from 'http'
import express from 'express'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addRemoteAutRoutes } from '../../lib/remote_aut_routes'
import { cookieJar } from '../../lib/automation/cookie/jar'

const PAGE_ORIGIN = 'http://www.foobar.com:3500'

describe('lib/remote_aut_routes', () => {
  let server: Server
  let baseUrl: string
  const setCredentials = vi.fn()
  const setBrowserCookie = vi.fn(async () => {})
  const reportAutError = vi.fn(async () => {})

  beforeEach(async () => {
    const app = express()
    const router = express.Router()

    // the proxy serves internal routes under the URL the page requested
    app.use((req, res, next) => {
      Object.assign(req, { proxiedUrl: `${PAGE_ORIGIN}${req.url}` })
      next()
    })

    addRemoteAutRoutes(router, { namespace: '__cypress', getNetworkProxy: () => ({ setCredentials }) as any, setBrowserCookie, reportAutError })
    app.use(router)

    server = app.listen(0)
    await new Promise((resolve) => server.once('listening', resolve))
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  })

  afterEach(async () => {
    cookieJar.removeAllCookies()
    vi.clearAllMocks()
    await new Promise((resolve) => server.close(resolve))
  })

  const post = (route: string, body: unknown) => {
    return fetch(`${baseUrl}/__cypress/remote/${route}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  }

  describe('GET remote/cookies', () => {
    it('returns the page\'s cookies that script could read', async () => {
      cookieJar.setCookie('visible=1; Path=/', `${PAGE_ORIGIN}/`, undefined)
      cookieJar.setCookie('hidden=1; Path=/; HttpOnly', `${PAGE_ORIGIN}/`, undefined)
      cookieJar.setCookie('other=1; Path=/', 'http://www.idp.com:3500/', undefined)

      const res = await fetch(`${baseUrl}/__cypress/remote/cookies?url=${encodeURIComponent(`${PAGE_ORIGIN}/page`)}`)
      const cookies = await res.json()

      expect(cookies.map((cookie) => cookie.name)).toEqual(['visible'])
    })

    it('refuses another origin\'s cookies', async () => {
      const res = await fetch(`${baseUrl}/__cypress/remote/cookies?url=${encodeURIComponent('http://www.idp.com:3500/')}`)

      expect(res.status).toBe(403)
    })
  })

  describe('POST remote/credentials', () => {
    it('reports a request\'s credentials to the proxy, whatever its origin', async () => {
      const res = await post('credentials', { url: 'http://www.idp.com:3500/api', resourceType: 'fetch', credentialStatus: 'include' })

      expect(res.status).toBe(204)
      expect(setCredentials).toHaveBeenCalledExactlyOnceWith({ url: 'http://www.idp.com:3500/api', resourceType: 'fetch', credentialStatus: 'include' })
    })

    it('rejects a report that is not for an http request', async () => {
      expect((await post('credentials', { url: 'javascript:void 0', resourceType: 'fetch', credentialStatus: 'omit' })).status).toBe(400)
      expect((await post('credentials', { url: 'http://www.idp.com:3500/', resourceType: 'image', credentialStatus: 'omit' })).status).toBe(400)
      expect(setCredentials).not.toHaveBeenCalled()
    })
  })

  describe('POST remote/uncaught', () => {
    it('reports the AUT\'s uncaught error before replying', async () => {
      let replied = false

      reportAutError.mockImplementationOnce(async () => {
        expect(replied).toBe(false)
      })

      const res = await post('uncaught', { handlerType: 'unhandledrejection', error: { name: 'Error', message: 'boom', stack: 'Error: boom\n    at one', extra: 1 } })

      replied = true

      expect(res.status).toBe(204)
      expect(reportAutError).toHaveBeenCalledExactlyOnceWith({ handlerType: 'unhandledrejection', error: { name: 'Error', message: 'boom', stack: 'Error: boom\n    at one' } })
    })

    it('rejects a report that is not an error', async () => {
      expect((await post('uncaught', { handlerType: 'warning', error: { message: 'boom' } })).status).toBe(400)
      expect((await post('uncaught', { handlerType: 'error', error: {} })).status).toBe(400)
      expect(reportAutError).not.toHaveBeenCalled()
    })
  })

  describe('POST remote/set-cookie', () => {
    const cookie = { name: 'key', value: 'value', domain: 'www.foobar.com', path: '/', hostOnly: true, httpOnly: false, secure: false, sameSite: 'lax', expiry: null, maxAge: null }

    it('sets a cookie the page sets in the server jar and the browser', async () => {
      const res = await post('set-cookie', { cookie, url: `${PAGE_ORIGIN}/page` })

      expect(res.status).toBe(204)
      expect(cookieJar.getCookies(`${PAGE_ORIGIN}/`).map((c) => `${c.key}=${c.value}`)).toEqual(['key=value'])
      expect(setBrowserCookie).toHaveBeenCalledExactlyOnceWith(cookie)
    })

    it('sets nothing for a domain the page could not set as top', async () => {
      const res = await post('set-cookie', { cookie: { ...cookie, domain: 'www.idp.com' }, url: `${PAGE_ORIGIN}/page` })

      expect(res.status).toBe(204)
      expect(cookieJar.getAllCookies()).toEqual([])
      expect(setBrowserCookie).not.toHaveBeenCalled()
    })

    it('refuses a cookie reported for another origin\'s page', async () => {
      const res = await post('set-cookie', { cookie, url: 'http://www.idp.com:3500/' })

      expect(res.status).toBe(400)
      expect(setBrowserCookie).not.toHaveBeenCalled()
    })
  })
})
