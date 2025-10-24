import { describe, expect, beforeAll, beforeEach, it, vi } from 'vitest'

describe('app/v3/content', () => {
  let port: { onMessage: { addListener: () => void }, postMessage: () => void }
  let chrome: { runtime: { connect: () => { onMessage: { addListener: () => void } } } }
  let window: { addEventListener: () => void, postMessage: () => void }

  beforeAll(async () => {
    port = {
      onMessage: {
        addListener: vi.fn(),
      },
      postMessage: vi.fn(),
    }

    chrome = {
      runtime: {
        connect: vi.fn().mockReturnValue(port),
      },
    }

    // @ts-expect-error
    global.chrome = chrome

    window = {
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    },

    // @ts-expect-error
    global.window = window
  })

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('adds window message listener and port onMessage listener', async () => {
    await vi.importActual('../../../app/v3/content')
    expect(window.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(port.onMessage.addListener).toHaveBeenCalledWith(expect.any(Function))
  })

  describe('messages from window (i.e Cypress)', () => {
    describe('on cypress:extension:activate:main:tab', () => {
      const data = { message: 'cypress:extension:activate:main:tab' }

      it('posts message to port', async () => {
        // @ts-expect-error
        vi.mocked(window.addEventListener).mockImplementation((event: MessageEvent, callback: (event: MessageEvent) => void) => callback({ data, source: window } as any))

        await vi.importActual('../../../app/v3/content')

        expect(port.postMessage).toHaveBeenCalledWith({
          message: 'activate:main:tab',
        })
      })

      it('is a noop if source is not the same window', async () => {
        // @ts-expect-error
        vi.mocked(window.addEventListener).mockImplementation((event: MessageEvent, callback: (event: MessageEvent) => void) => callback({ data, source: {} } as any))
        await vi.importActual('../../../app/v3/content')

        expect(port.postMessage).not.toHaveBeenCalled()
      })
    })

    describe('on cypress:extension:url:changed', () => {
      const data = { message: 'cypress:extension:url:changed', url: 'the://url' }

      it('posts message to port', async () => {
        // @ts-expect-error
        vi.mocked(window.addEventListener).mockImplementation((event: MessageEvent, callback: (event: MessageEvent) => void) => callback({ data, source: window } as any))
        await vi.importActual('../../../app/v3/content')

        expect(port.postMessage).toHaveBeenCalledWith({
          message: 'url:changed',
          url: data.url,
        })
      })

      it('is a noop if source is not the same window', async () => {
        // @ts-expect-error
        vi.mocked(window.addEventListener).mockImplementation((event: MessageEvent, callback: (event: MessageEvent) => void) => callback({ data, source: {} } as any))
        await vi.importActual('../../../app/v3/content')

        expect(port.postMessage).not.toHaveBeenCalled()
      })
    })

    it('is a noop if message is not supported', async () => {
      const data = { message: 'unsupported' }

      // @ts-expect-error
      vi.mocked(window.addEventListener).mockImplementation((event: MessageEvent, callback: (event: MessageEvent) => void) => callback({ data, source: window } as any))
      await vi.importActual('../../../app/v3/content')

      expect(port.postMessage).not.toHaveBeenCalled()
    })
  })

  describe('messages from port (i.e. service worker)', () => {
    describe('on main:tab:activated', () => {
      it('posts message to window', async () => {
        // @ts-expect-error
        vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ message: 'main:tab:activated' } as any))
        await vi.importActual('../../../app/v3/content')

        expect(window.postMessage).toHaveBeenCalledWith({ message: 'cypress:extension:main:tab:activated' }, '*')
      })
    })

    it('is a noop if message is not main:tab:activated', async () => {
      const data = { message: 'unsupported' }

      // @ts-expect-error
      vi.mocked(port.onMessage.addListener).mockImplementation((callback: (event: MessageEvent) => void) => callback({ data, source: window } as any))
      await vi.importActual('../../../app/v3/content')

      expect(window.postMessage).not.toHaveBeenCalled()
    })
  })
})
