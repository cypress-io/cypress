import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

describe('app/v3/service-worker', () => {
  let chrome: { runtime: { onConnect: { addListener: () => void } }, tabs: { query: () => void, update: () => void }, storage: { local: { set: () => void, get: () => void } } }
  let port: { onMessage: { addListener: () => void }, postMessage: () => void }

  beforeAll(() => {
    chrome = {
      runtime: {
        onConnect: {
          addListener: vi.fn(),
        },
      },
      tabs: {
        query: vi.fn(),
        update: vi.fn(),
      },
      storage: {
        local: {
          set: vi.fn(),
          get: vi.fn(),
        },
      },
    }

    // @ts-expect-error
    global.chrome = chrome
  })

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    port = {
      onMessage: {
        addListener: vi.fn(),
      },
      postMessage: vi.fn(),
    }
  })

  it('adds onConnect listener', async () => {
    await vi.importActual('../../../app/v3/service-worker')
    expect(chrome.runtime.onConnect.addListener).toHaveBeenCalledWith(expect.any(Function))
  })

  it('adds port onMessage listener', async () => {
    // @ts-expect-error
    vi.mocked(chrome.runtime.onConnect.addListener).mockImplementation((fn: (port: { onMessage: { addListener: () => void } }) => void) => fn(port))
    await vi.importActual('../../../app/v3/service-worker')

    expect(port.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function))
  })

  describe('on message', () => {
    beforeEach(() => {
      // @ts-expect-error
      vi.mocked(chrome.runtime.onConnect.addListener).mockImplementation((fn: (port: { onMessage: { addListener: () => void } }) => void) => fn(port))
    })

    describe('activate:main:tab', () => {
      const tab1 = { id: '1', url: 'the://url' }
      const tab2 = { id: '2', url: 'some://other.url' }

      beforeEach(() => {
        // @ts-expect-error
        vi.mocked(chrome.tabs.query).mockResolvedValue([tab1, tab2])
      })

      describe('when there is a most recent url', () => {
        beforeEach(() => {
          // @ts-expect-error
          vi.mocked(chrome.storage.local.get).mockImplementation((key: string, callback: (result: { mostRecentUrl: string }) => void) => callback({ mostRecentUrl: tab1.url }))
        })

        it('activates the tab matching the url', async () => {
          // @ts-expect-error
          vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'activate:main:tab' } as any))

          await vi.importActual('../../../app/v3/service-worker')

          expect(chrome.tabs.update).toHaveBeenCalledWith(tab1.id, { active: true })
        })

        describe('but no tab matches the most recent url', () => {
          beforeEach(() => {
            // @ts-expect-error
            vi.mocked(chrome.tabs.query).mockResolvedValue([tab2])
          })

          it('does not try to activate any tabs', async () => {
            // @ts-expect-error
            vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'activate:main:tab' } as any))
            await vi.importActual('../../../app/v3/service-worker')

            expect(chrome.tabs.update).not.toHaveBeenCalled()
          })
        })

        describe('and chrome throws an error while activating the tab', () => {
          let err: Error

          beforeEach(() => {
            vi.spyOn(console, 'log').mockImplementation(() => undefined)
            err = new Error('uh oh')
            vi.mocked(chrome.tabs.update).mockRejectedValue(err)
          })

          it('is a noop, logging the error', async () => {
            // @ts-expect-error
            vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'activate:main:tab' } as any))
            await vi.importActual('../../../app/v3/service-worker')

            // eslint-disable-next-line no-console
            expect(console.log).toHaveBeenCalledWith('Activating main Cypress tab errored:', err)
          })
        })
      })

      describe('when there is not a most recent url', () => {
        beforeEach(() => {
          // @ts-expect-error
          vi.mocked(chrome.storage.local.get).mockImplementation((key: string, callback: (result: { mostRecentUrl: string }) => void) => callback({}))
        })

        it('does not try to activate any tabs', async () => {
          // @ts-expect-error
          vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'activate:main:tab' } as any))
          await vi.importActual('../../../app/v3/service-worker')

          expect(chrome.tabs.update).not.toHaveBeenCalled()
        })
      })
    })

    describe('url:changed', () => {
      it('sets the mostRecentUrl', async () => {
        const url = 'some://url'

        // @ts-expect-error
        vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'url:changed', url } as any))
        await vi.importActual('../../../app/v3/service-worker')

        expect(chrome.storage.local.set).toHaveBeenCalledWith({ mostRecentUrl: url })
      })
    })

    it('is a noop if message is not a supported message', async () => {
      // @ts-expect-error
      vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'unsupported' } as any))
      await vi.importActual('../../../app/v3/service-worker')

      expect(chrome.tabs.update).not.toHaveBeenCalled()
      expect(chrome.storage.local.set).not.toHaveBeenCalled()
    })
  })
})
