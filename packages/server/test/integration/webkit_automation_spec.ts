import http from 'http'
import type { AddressInfo } from 'net'
import os from 'os'
import { expect } from '../spec_helper'
import { WebKitAutomation } from '../../lib/browsers/webkit-automation'

// Real-WebKit integration coverage for the `reset:browser:state` automation handler.
//
// Launches an actual WebKit browser via `playwright-webkit`, seeds cookies / web storage / a
// permission on a live origin, sends `reset:browser:state`, and asserts the state is cleared
// *in place on the same Playwright context*. Reusing the context is the point: between specs
// WebKit normally gets a brand-new context (fresh cookies + storage), so asserting against the
// same context proves the handler itself clears state.
describe('lib/browsers/webkit-automation - reset:browser:state (real WebKit)', function () {
  // launching a real browser is slow; give it room beyond the default mocha timeout
  this.timeout(60000)

  const html = '<!doctype html><html><head><title>wk reset</title></head><body>ok</body></html>'

  let pwBrowser: any
  let server: http.Server
  let origin: string
  let wk: WebKitAutomation

  before(async function () {
    // Stand up a real origin so cookies and localStorage are valid (they cannot be set on
    // about:blank).
    server = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html')
      res.end(html)
    })

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))

    const { port } = server.address() as AddressInfo

    origin = `http://127.0.0.1:${port}`

    // playwright-webkit (or its host system libraries) may not be installed in every environment.
    // Skip rather than fail so unrelated suites are unaffected; CI's install-webkit-deps step
    // ensures this actually runs in the webkit jobs.
    try {
      const playwright = require('playwright-webkit')

      pwBrowser = await playwright.webkit.launch({ headless: true })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Skipping real-WebKit reset:browser:state test - could not launch WebKit: ${err.message}`)
      this.skip()
    }
  })

  after(async () => {
    if (pwBrowser) await pwBrowser.close()

    if (server) await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  beforeEach(async () => {
    wk = await WebKitAutomation.create({
      // create() only reads optional automation hooks (all via optional chaining), so a bare
      // object is sufficient here.
      automation: {} as any,
      browser: pwBrowser,
      initialUrl: `${origin}/`,
      downloadsFolder: os.tmpdir(),
    })
  })

  const readStorage = () => {
    const page = (wk as any).page

    return page.evaluate(() => {
      return {
        ls: window.localStorage.getItem('ls-key'),
        ss: window.sessionStorage.getItem('ss-key'),
      }
    })
  }

  it('clears cookies and web storage on the live context without recreating it', async () => {
    const context = (wk as any).context
    const page = (wk as any).page

    // seed cookies, web storage, and a permission override on the live origin
    await context.addCookies([{ name: 'foo', value: 'bar', url: origin }])
    await page.evaluate(() => {
      window.localStorage.setItem('ls-key', 'ls-val')
      window.sessionStorage.setItem('ss-key', 'ss-val')
    })

    await context.grantPermissions(['geolocation'], { origin })

    // sanity check the state actually landed before resetting
    expect(await context.cookies(), 'cookie seeded').to.have.length(1)
    expect(await readStorage(), 'storage seeded').to.deep.equal({ ls: 'ls-val', ss: 'ss-val' })

    // exercise the handler under test
    await wk.onRequest('reset:browser:state', {})

    // the same Playwright context/page is reused - this is not the fresh-context path
    expect((wk as any).context, 'context is reused, not recreated').to.equal(context)
    expect((wk as any).page, 'page is reused, not recreated').to.equal(page)

    // cookies and web storage are cleared in place (a permission was also granted above, so this
    // additionally proves clearPermissions() does not throw against a real context)
    expect(await context.cookies(), 'cookies cleared').to.have.length(0)
    expect(await readStorage(), 'web storage cleared').to.deep.equal({ ls: null, ss: null })
  })
})
