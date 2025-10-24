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

  it('sends a tab activation request to the plugin, and rejects if it times out', async () => {
    vi.mocked(mockBrowser.pages).mockResolvedValue([mockPage] as Page[])

    return new Promise<void>(async (resolve) => {
      mockPage.evaluate = vi.fn().mockImplementation(async (fn, ...args) => {
        try {
          await fn(...args)
        } catch (error) {
          expect(window.removeEventListener).toHaveBeenCalledExactlyOnceWith('message', expect.any(Function))
          expect(error).toBeUndefined()
          resolve()
        }
      })

        const activationPromise = activateMainTab(mockBrowser as Browser)

        await vi.advanceTimersByTimeAsync(ACTIVATION_TIMEOUT + 1)
        await activationPromise
    })
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
