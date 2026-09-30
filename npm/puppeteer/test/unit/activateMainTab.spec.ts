import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Browser, Page } from 'puppeteer-core'
import { activateMainTab, ACTIVATION_TIMEOUT } from '../../src/plugin/activateMainTab'

describe('activateMainTab', () => {
  let prevWin: Window
  let prevDoc: Document
  let prevTop: Window & typeof globalThis
  let window: Partial<Window>
  let mockDocument: Partial<Document> & {
    defaultView: Window & typeof globalThis
  }
  let mockTop: Partial<Window & typeof globalThis>
  let mockBrowser: Partial<Browser>
  let mockPage: Partial<Page>

  beforeEach(() => {
    vi.useFakeTimers()
    window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),

      postMessage: vi.fn(),
    }

    mockDocument = {
      defaultView: window as Window & typeof globalThis,
    }

    mockTop = mockDocument.defaultView

    // activateMainTab is eval'd in browser context, but the tests exec in a
    // node context. We don't necessarily need to do this swap, but it makes the
    // tests more portable.
    prevWin = global.window
    prevDoc = global.document
    // @ts-expect-error
    prevTop = global.top
    // @ts-expect-error
    global.window = window
    global.document = mockDocument as Document
    // @ts-expect-error
    global.top = mockTop

    mockPage = {
      evaluate: vi.fn().mockImplementation((fn, ...args) => fn(...args)),
      bringToFront: vi.fn().mockResolvedValue(undefined),
    }

    mockBrowser = {
      pages: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllTimers()
    // @ts-expect-error
    global.window = prevWin
    global.top = prevTop
    global.document = prevDoc
  })

  it('sends a tab activation request to the plugin, and resolves when the ack event is received', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])
    vi.mocked(window.addEventListener).mockImplementation((event, listener) => {
      if (event === 'message') {
        // @ts-expect-error
        listener({ data: { message: 'cypress:extension:main:tab:activated' } })
      }
    })

    await activateMainTab(mockBrowser as Browser)

    expect(window.postMessage).toHaveBeenCalledExactlyOnceWith({ message: 'cypress:extension:activate:main:tab' })
  })

  it('rejects the activation message with an error naming the timeout if the extension does not respond', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])

    let evaluateResult: Promise<unknown> | undefined

    mockPage.evaluate = vi.fn().mockImplementation((fn, ...args) => {
      evaluateResult = fn(...args)

      return evaluateResult
    })

    const activationPromise = activateMainTab(mockBrowser as Browser)

    await vi.advanceTimersByTimeAsync(ACTIVATION_TIMEOUT + 1)
    await activationPromise

    await expect(evaluateResult).rejects.toThrow(`The Cypress extension did not respond within ${ACTIVATION_TIMEOUT}ms.`)
    expect(window.removeEventListener).toHaveBeenCalledExactlyOnceWith('message', expect.any(Function))
  })

  it('does not bring the page to the front when the extension responds', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])
    mockPage.evaluate = vi.fn().mockResolvedValue(undefined)

    await activateMainTab(mockBrowser as Browser)

    expect(mockPage.bringToFront).not.toHaveBeenCalled()
  })

  it('brings the page to the front over CDP when the extension times out', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])

    const activationPromise = activateMainTab(mockBrowser as Browser)

    await vi.advanceTimersByTimeAsync(ACTIVATION_TIMEOUT + 1)

    await expect(activationPromise).resolves.toBeUndefined()
    expect(mockPage.bringToFront).toHaveBeenCalledOnce()
  })

  it('brings the page to the front over CDP when evaluating the activation message fails', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])
    mockPage.evaluate = vi.fn().mockRejectedValue(new Error('Execution context was destroyed'))

    await expect(activateMainTab(mockBrowser as Browser)).resolves.toBeUndefined()
    expect(mockPage.bringToFront).toHaveBeenCalledOnce()
  })

  it('rejects with both errors if the extension and the CDP fallback both fail', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])
    mockPage.evaluate = vi.fn().mockRejectedValue(new Error('The Cypress extension did not respond within 2000ms.'))
    mockPage.bringToFront = vi.fn().mockRejectedValue(new Error('Target closed'))

    await expect(activateMainTab(mockBrowser as Browser)).rejects.toThrow(
      'The Cypress extension did not respond within 2000ms. Bringing the main tab to the front over CDP also failed: Target closed',
    )
  })

  it('does nothing if the browser has no pages', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([])

    await expect(activateMainTab(mockBrowser as Browser)).resolves.toBeUndefined()
    expect(mockPage.evaluate).not.toHaveBeenCalled()
  })

  describe('when cy in cy', () => {
    beforeEach(() => {
      mockDocument.defaultView = {} as Window & typeof globalThis
    })

    it('does not try to send tab activation message', async () => {
      vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])
      await activateMainTab(mockBrowser as Browser)

      expect(window.postMessage).not.toHaveBeenCalled()
      expect(window.addEventListener).not.toHaveBeenCalled()
    })
  })
})
