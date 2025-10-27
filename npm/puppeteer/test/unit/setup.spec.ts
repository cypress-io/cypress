import { describe, it, expect, vi, Mock } from 'vitest'
import type { PuppeteerNode, Browser } from 'puppeteer-core'
import { setup } from '../../src/plugin'
import { activateMainTab } from '../../src/plugin/activateMainTab'

vi.mock('../../src/plugin/activateMainTab')

const flushPromises = () => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve)
  })
}

describe('#setup', () => {
  let mockBrowser: Partial<Browser>
  let mockPuppeteer: Pick<PuppeteerNode, 'connect'>
  let on: Mock
  let onMessage: Record<string, Mock>

  const testTask = 'test'
  let testTaskHandler: Mock

  beforeEach(() => {
    vi.mocked(activateMainTab).mockClear()

    mockBrowser = {
      disconnect: vi.fn().mockResolvedValue(undefined),
    }

    mockPuppeteer = {
      connect: vi.fn().mockResolvedValue(mockBrowser),
    }

    on = vi.fn()

    testTaskHandler = vi.fn()

    onMessage = {
      [testTask]: testTaskHandler,
    }
  })

  it('registers `after:browser:launch` and `task` handlers', () => {
    setup({ on, onMessage })

    expect(on).toHaveBeenCalledWith('after:browser:launch', expect.any(Function))
    expect(on).toHaveBeenCalledWith('task', {
      __cypressPuppeteer__: expect.any(Function),
    })
  })

  it('errors if registering `after:browser:launch` fails', () => {
    const error = new Error('Event not registered')

    error.stack = '<error stack>'
    on.mockImplementation(() => { throw error })

    expect(() => setup({ on, onMessage })).toThrow('Could not set up `after:browser:launch` task. Ensure you are running Cypress >= 13.6.0. The following error was encountered:\n\n<error stack>')
  })

  describe('running message handler', () => {
    it('connects puppeteer to browser', async () => {
      on.mockImplementation((event, handler) => {
        if (event === 'after:browser:launch') {
          handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          return handler.__cypressPuppeteer__({ name: testTask, args: [] })
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      expect(mockPuppeteer.connect).toHaveBeenCalledWith({
        browserWSEndpoint: 'ws://debugger',
        defaultViewport: null,
      })
    })

    it('calls the specified message handler with the browser and args', async () => {
      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          return handler.__cypressPuppeteer__({ name: testTask, args: ['arg1', 'arg2'] })
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      await flushPromises()

      expect(testTaskHandler).toHaveBeenCalledWith(mockBrowser, 'arg1', 'arg2')
    })

    it('disconnects the browser once the message handler is finished', async () => {
      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          return handler.__cypressPuppeteer__({ name: testTask, args: ['arg1', 'arg2'] })
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      await flushPromises()

      expect(mockBrowser.disconnect).toHaveBeenCalled()
    })

    it('returns the result of the handler', async () => {
      onMessage[testTask].mockResolvedValue('result')

      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: testTask, args: ['arg1', 'arg2'] })

          return taskResult
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      await flushPromises()

      expect(taskResult).toEqual('result')
    })

    it('returns null if message handler returns undefined', async () => {
      onMessage[testTask].mockResolvedValue(undefined)

      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: testTask, args: ['arg1', 'arg2'] })

          return taskResult
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      await flushPromises()
      expect(taskResult).toBeNull()
    })

    it('returns error object if debugger URL reference is lost', async () => {
      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: 'nonexistent', args: [] })

          return taskResult
        }
      })

      setup({ on, onMessage })

      await flushPromises()

      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual(
        'Lost the reference to the browser. This usually occurs because the Cypress config was reloaded without the browser re-launching. Close and re-open the browser.',
      )
    })

    it('returns error object if browser is not supported', async () => {
      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'Firefox' }, {})
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: 'nonexistent', args: [] })

          return taskResult
        }
      })

      setup({ on, onMessage })

      await flushPromises()

      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual(
        'Only browsers in the "Chromium" family are supported. You are currently running a browser with the family: Firefox',
      )
    })

    it('disconnects browser and returns error object if message handler errors', async () => {
      testTaskHandler.mockRejectedValue(new Error('handler error'))

      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: testTask, args: ['arg1', 'arg2'] })

          return taskResult
        }
      })

      setup({
        on,
        puppeteer: mockPuppeteer as PuppeteerNode,
        onMessage,
      })

      await flushPromises()

      expect(mockBrowser.disconnect).toHaveBeenCalled()
      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual('handler error')
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: 'nonexistent', args: [] })

          return taskResult
        }
      })

      setup({ on, onMessage })

      await flushPromises()

      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual(
        'Could not find message handler with the name `nonexistent`. Registered message handler names are: test.',
      )
    })

    it('returns error object if message handler with given name cannot be found', async () => {
      let taskResult: any = null

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: 'notAFunction', args: [] })

          return taskResult
        }
      })

      // @ts-expect-error
      setup({ on, onMessage: { notAFunction: true } })

      await flushPromises()
      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual(
        'Message handlers must be functions, but the message handler for the name `notAFunction` was type `boolean`.',
      )
    })

    it('calls activateMainTab if there is a page in the browser', async () => {
      let taskResult: any = null

      vi.mocked(activateMainTab).mockImplementation((browser) => {
        if (browser === mockBrowser) {
          return Promise.resolve()
        }

        return Promise.reject(new Error('browser not found'))
      })

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: testTask, args: [] })

          return taskResult
        }
      })

      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })

      await flushPromises()
      expect(activateMainTab).toHaveBeenCalledWith(mockBrowser)
    })

    it('returns an error object if activateMainTab rejects', async () => {
      let taskResult: any = null

      vi.mocked(activateMainTab).mockImplementation((browser) => {
        if (browser === mockBrowser) {
          return Promise.reject()
         }

        return Promise.resolve()
      })

      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          taskResult = await handler.__cypressPuppeteer__({ name: testTask, args: [] })

          return taskResult
        }
      })

      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })

      await flushPromises()

      expect(taskResult.__error__).toBeInstanceOf(Object)
      expect(taskResult.__error__.message).toEqual(
        'Cannot communicate with the Cypress Chrome extension. Ensure the extension is enabled when using the Puppeteer plugin.',
      )
    })

    it('does not try to activate main tab when the browser is headless', async () => {
      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: false }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          return handler.__cypressPuppeteer__({ name: testTask, args: [] })
        }
      })

      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })

      await flushPromises()
      expect(activateMainTab).not.toHaveBeenCalled()
    })

    it('does not try to activate main tab when the browser is electron', async () => {
      on.mockImplementation(async (event, handler) => {
        if (event === 'after:browser:launch') {
          return handler({ family: 'chromium', isHeaded: true, name: 'electron' }, { webSocketDebuggerUrl: 'ws://debugger' })
        }

        if (event === 'task') {
          return handler.__cypressPuppeteer__({ name: testTask, args: [] })
        }
      })

      setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })

      await flushPromises()
      expect(activateMainTab).not.toHaveBeenCalled()
    })

    it('catastrophically fails when the browser is Google Chrome Branded 137 and up and we are running in headed mode', async () => {
      await new Promise<void>((resolve) => {
        on.mockImplementationOnce(async (event, handler) => {
          if (event === 'after:browser:launch') {
            try {
               handler({ family: 'chromium', isHeaded: true, name: 'chrome', majorVersion: '137' }, { webSocketDebuggerUrl: 'ws://debugger' })
            } catch (error) {
              expect(error).toBeInstanceOf(Error)
              expect(error.message).toEqual('@cypress/puppeteer does not work in Google Chrome v137 and higher in cypress open mode (or headed run mode). If you need to use @cypress/puppeteer in headed mode, please use Electron, Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.')
              resolve()
            }
          }
        })

        setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      })

      await new Promise<void>((resolve) => {
        on.mockImplementationOnce(async (event, handler) => {
          if (event === 'after:browser:launch') {
            try {
               handler({ family: 'chromium', isHeaded: true, name: 'chrome', majorVersion: '141' }, { webSocketDebuggerUrl: 'ws://debugger' })
            } catch (error) {
              expect(error).toBeInstanceOf(Error)
              expect(error.message).toEqual('@cypress/puppeteer does not work in Google Chrome v137 and higher in cypress open mode (or headed run mode). If you need to use @cypress/puppeteer in headed mode, please use Electron, Chrome for Testing, Chromium, or another Chrome variant that supports loading extensions.')
              resolve()
            }
          }
        })

        setup({ on, onMessage, puppeteer: mockPuppeteer as PuppeteerNode })
      })
    })
  })

  describe('validation', () => {
    it('errors if options argument is not provided', () => {
      // @ts-expect-error
      expect(() => setup()).toThrow('Must provide options argument to `setup`.')
    })

    it('errors if options argument is not an object', () => {
      // @ts-expect-error
      expect(() => setup(true)).toThrow('The options argument provided to `setup` must be an object.')
    })

    it('errors if `on` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({})).toThrow('Must provide `on` function to `setup`.')
    })

    it('errors if `on` option is not a function', () => {
      // @ts-expect-error
      expect(() => setup({ on: 'string' })).toThrow('The `on` option provided to `setup` must be a function.')
    })

    it('errors if `onMessage` option is not provided', () => {
      // @ts-expect-error
      expect(() => setup({ on: vi.fn() })).toThrow('Must provide `onMessage` object to `setup`.')
    })

    it('errors if `onMessage` option is not an object', () => {
      // @ts-expect-error
      expect(() => setup({ on: vi.fn(), onMessage: () => {} })).toThrow('The `onMessage` option provided to `setup` must be an object.')
    })
  })
})
