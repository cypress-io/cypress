import { expect } from '../spec_helper'
import http from 'http'
import os from 'os'
import type playwright from 'playwright-webkit'
import { resolveAutFrame, WebKitAutomation } from '../../lib/browsers/webkit-automation'

// These tests exercise the WebKit AUT-frame automation against a REAL
// playwright-webkit browser. They require the WebKit browser binary to be
// installed (`npx playwright install webkit`), so they self-skip when it is
// not available (e.g. unprivileged/dev containers). They are intended to run
// in the environment that already provisions the WebKit binary.
describe('lib/browsers/webkit-automation - real browser', () => {
  let pw: typeof playwright
  let browser: playwright.Browser | undefined
  let parentServer: http.Server | undefined
  let childServer: http.Server | undefined
  let parentUrl: string
  let childUrl: string

  const listen = (server: http.Server): Promise<number> => {
    return new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve((server.address() as any).port))
    })
  }

  const close = (server?: http.Server): Promise<void> => {
    return new Promise((resolve) => (server ? server.close(() => resolve()) : resolve()))
  }

  // poll the page's frames until one navigates to the given url, since the
  // cross-origin AUT frame loads asynchronously after the parent document
  const waitForFrameUrl = async (page: playwright.Page, url: string): Promise<playwright.Frame> => {
    const start = Date.now()

    while (Date.now() - start < 10000) {
      const frame = page.frames().find((frame) => frame.url() === url)

      if (frame) return frame

      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    throw new Error(`timed out waiting for frame with url ${url}`)
  }

  before(async function () {
    this.timeout(120000)

    pw = require('playwright-webkit')

    try {
      browser = await pw.webkit.launch()
    } catch (err) {
      // WebKit binary is not installed in this environment, so we cannot run
      // the real-browser assertions here. Skip rather than fail.
      this.skip()
    }
  })

  after(async () => {
    await browser?.close()
  })

  beforeEach(async () => {
    // the child origin acts as the "AUT". A distinct port makes it a different
    // origin than the parent, which is exactly the cy.origin() scenario.
    childServer = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html')
      res.end('<!doctype html><html><head><title>child app</title></head><body>child app</body></html>')
    })

    const childPort = await listen(childServer)

    childUrl = `http://127.0.0.1:${childPort}/`

    // the parent origin embeds the AUT iframe cross-origin, using the same id
    // the Cypress runner assigns to the AUT iframe ("Your project: '<name>'").
    // playwright's frame.name() falls back to the iframe id, which is how
    // resolveAutFrame identifies the frame.
    parentServer = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html')
      res.end(`<!doctype html><html><body><iframe id="Your project: 'test'" src="${childUrl}"></iframe></body></html>`)
    })

    const parentPort = await listen(parentServer)

    parentUrl = `http://127.0.0.1:${parentPort}/`
  })

  afterEach(async () => {
    await close(parentServer)
    await close(childServer)
  })

  it('resolveAutFrame finds the cross-origin AUT frame and reports its url', async () => {
    const context = await browser!.newContext()
    const page = await context.newPage()

    try {
      await page.goto(parentUrl)
      await waitForFrameUrl(page, childUrl)

      const frame = resolveAutFrame(page)

      // the resolved frame is the cross-origin AUT frame, not the top frame
      expect(frame.url()).to.equal(childUrl)
      expect(frame.url()).not.to.equal(parentUrl)
      expect(frame.name()).to.equal(`Your project: 'test'`)
    } finally {
      await context.close()
    }
  })

  it('handles the get:aut:url automation command against the cross-origin AUT frame', async () => {
    const wkAutomation = await WebKitAutomation.create({
      automation: {} as any,
      browser: browser!,
      initialUrl: parentUrl,
      downloadsFolder: os.tmpdir(),
    })

    // the AUT frame loads asynchronously, so poll the real automation handler
    // until it reports the cross-origin url
    const start = Date.now()
    let url: string | undefined

    while (Date.now() - start < 10000) {
      url = await wkAutomation.onRequest('get:aut:url', {})

      if (url === childUrl) break

      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    expect(url).to.equal(childUrl)
  })

  it('throws when there is no AUT frame to resolve', async () => {
    const context = await browser!.newContext()
    const page = await context.newPage()

    try {
      // navigate somewhere with no child frames at all
      await page.goto(childUrl)

      expect(() => resolveAutFrame(page)).to.throw('Could not find AUT frame')
    } finally {
      await context.close()
    }
  })
})
