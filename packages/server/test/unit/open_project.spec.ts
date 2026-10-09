import _ from 'lodash'
import Bluebird from 'bluebird'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import browsers from '../../lib/browsers'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import { ProjectBase } from '../../lib/project-base'
import { openProject } from '../../lib/open_project'
import preprocessor from '../../lib/plugins/preprocessor'
import runEvents from '../../lib/plugins/run_events'
import Fixtures from '@tooling/system-tests'
import { GracefulExit } from '../../lib/util/graceful-exit'
import delay from 'lodash/delay'

// Building the real schemas in this worker loads a second `graphql` realm, which
// `graphql` rejects. Opening a project never queries either schema.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean }

testGlobals.IS_TEST = true

const originalEnv = _.clone(process.env)

const todosPath = Fixtures.projectPath('todos')

const browsersOpen = () => browsers.open as unknown as Mock

// sinon's `calledWith` ignores trailing arguments, so match on the event name.
const executeCallsFor = (event: string) => {
  return vi.mocked(runEvents.execute).mock.calls.filter(([first]) => first === event)
}

describe('lib/open_project', () => {
  let automation
  let config
  let onError: Mock
  let spec
  let browser

  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    automation = {
      reset: vi.fn(),
      use: vi.fn(),
    }

    config = {
      excludeSpecPattern: '**/*.nope',
      projectRoot: todosPath,
      proxyServer: 'http://cy-proxy-server',
    }

    onError = vi.fn()
    vi.spyOn(browsers, 'get').mockResolvedValue(undefined as any)
    vi.spyOn(browsers, 'open').mockImplementation(() => undefined as any)
    vi.spyOn(browsers, 'connectToNewSpec').mockImplementation(() => undefined as any)
    vi.spyOn(ProjectBase.prototype, 'initializeConfig').mockResolvedValue({
      specPattern: 'cypress/integration/**/*',
    } as any)

    vi.spyOn(ProjectBase.prototype, 'open').mockResolvedValue(undefined as any)
    vi.spyOn(ProjectBase.prototype, 'reset').mockResolvedValue(undefined as any)
    vi.spyOn(ProjectBase.prototype, 'getConfig').mockImplementation(() => config)
    vi.spyOn(ProjectBase.prototype, 'getAutomation').mockImplementation(() => automation)
    vi.spyOn(preprocessor, 'removeFile').mockImplementation(() => undefined as any)

    return Fixtures.scaffoldProject('todos').then(() => {
      return openProject.create(todosPath, { testingType: 'e2e' }, { onError })
    })
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()

    process.env = _.clone(originalEnv)
  })

  describe('#launch', () => {
    beforeEach(async () => {
      await openProject.create(todosPath, { testingType: 'e2e' }, { onError })
      openProject.getProject().__setConfig({
        browserUrl: 'http://localhost:8888/__/',
        projectRoot: todosPath,
        specType: 'integration',
        e2e: {
          specPattern: 'cypress/integration/**/*',
        },
      })

      openProject.getProject().options = {
        onError,
      }

      spec = {
        absolute: 'path/to/spec',
        relative: 'path/to/spec',
      }

      browser = { name: 'chrome', family: 'chromium' }
    })

    it('tells preprocessor to remove file on browser close', () => {
      return openProject.launch(browser, spec)
      .then(() => {
        browsersOpen().mock.lastCall![1].onBrowserClose()

        expect(preprocessor.removeFile).toHaveBeenCalledWith('path/to/spec', config)
      })
    })

    it('does not tell preprocessor to remove file if no spec', () => {
      return openProject.launch(browser, {})
      .then(() => {
        browsersOpen().mock.lastCall![1].onBrowserClose()

        expect(preprocessor.removeFile).not.toHaveBeenCalled()
      })
    })

    it('runs original onBrowserClose callback on browser close', () => {
      const onBrowserClose = vi.fn()
      const options = { onBrowserClose }

      return openProject.launch(browser, spec, options)
      .then(() => {
        browsersOpen().mock.lastCall![1].onBrowserClose()

        expect(onBrowserClose).toHaveBeenCalled()
      })
    })

    it('calls project.reset on launch', () => {
      return openProject.launch(browser, spec)
      .then(() => {
        expect(ProjectBase.prototype.reset).toHaveBeenCalled()
      })
    })

    it('sets isHeaded + isHeadless if not already defined', () => {
      expect(browser.isHeaded).toBeUndefined()
      expect(browser.isHeadless).toBeUndefined()

      return openProject.launch(browser, spec)
      .then(() => {
        expect(browser.isHeaded).toBe(true)

        expect(browser.isHeadless).toBe(false)
      })
    })

    describe('spec events', () => {
      beforeEach(() => {
        vi.spyOn(runEvents, 'execute').mockResolvedValue(undefined)
      })

      it('executes after:spec on browser close if in interactive mode', () => {
        config.experimentalInteractiveRunEvents = true
        config.isTextTerminal = false
        const onBrowserClose = () => Promise.resolve()

        return openProject.launch(browser, spec, { onBrowserClose })
        .then(() => {
          return browsersOpen().mock.lastCall![1].onBrowserClose()
        })
        .then(() => {
          expect(runEvents.execute).toHaveBeenCalledWith('after:spec', spec)
        })
      })

      it('does not execute after:spec on browser close if not in interactive mode', () => {
        config.experimentalInteractiveRunEvents = true
        config.isTextTerminal = true
        const onBrowserClose = () => Promise.resolve()

        return openProject.launch(browser, spec, { onBrowserClose })
        .then(() => {
          return browsersOpen().mock.lastCall![1].onBrowserClose()
        })
        .then(() => {
          expect(executeCallsFor('after:spec')).toHaveLength(0)
        })
      })

      it('does not execute after:spec on browser close if experimental flag is not enabled', () => {
        config.experimentalInteractiveRunEvents = false
        config.isTextTerminal = false
        const onBrowserClose = () => Promise.resolve()

        return openProject.launch(browser, spec, { onBrowserClose })
        .then(() => {
          return browsersOpen().mock.lastCall![1].onBrowserClose()
        })
        .then(() => {
          expect(executeCallsFor('after:spec')).toHaveLength(0)
        })
      })

      it('does not execute after:spec on browser close if the project is no longer open', () => {
        config.experimentalInteractiveRunEvents = true
        config.isTextTerminal = false
        const onBrowserClose = () => Promise.resolve()

        return openProject.launch(browser, spec, { onBrowserClose })
        .then(() => {
          openProject.__reset()

          return browsersOpen().mock.lastCall![1].onBrowserClose()
        })
        .then(() => {
          expect(executeCallsFor('after:spec')).toHaveLength(0)
        })
      })

      // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23448
      it('sends after:spec errors through onError option', { retry: 15 }, () => {
        const err = new Error('thrown from after:spec handler')

        config.experimentalInteractiveRunEvents = true
        config.isTextTerminal = false
        vi.mocked(runEvents.execute).mockImplementation(async (event) => {
          if (event === 'after:spec') {
            throw err
          }
        })

        return openProject.launch(browser, spec, { onError })
        .then(() => {
          return browsersOpen().mock.lastCall![1].onBrowserClose()
        })
        .then(() => {
          return new Bluebird((res) => {
            delay(() => {
              expect(executeCallsFor('after:spec')).not.toHaveLength(0)
              expect(onError).toHaveBeenCalledWith(err)
              res(undefined)
            }, 100)
          })
        })
      })

      it('calls connectToNewSpec when shouldLaunchNewTab is set and the browser is not electron', async () => {
        await openProject.launch(browser, spec, { shouldLaunchNewTab: true })
        expect(vi.mocked(browsers.connectToNewSpec).mock.lastCall![0]).toBe(browser)
      })

      it('calls open when shouldLaunchNewTab is set and the browser is electron', async () => {
        await openProject.launch({ name: 'electron' }, spec, { shouldLaunchNewTab: true })
        expect(browsers.open).toHaveBeenCalledOnce()
      })

      // The launch resolves the network path once and hands the answer down, so
      // the launcher flags, the CDP wiring, and the server's request-time gates
      // cannot disagree about it.
      describe('resolved network path', () => {
        it('passes the browser network path to the launcher for a chromium browser', async () => {
          await openProject.launch(browser, spec)

          expect(browsersOpen().mock.lastCall![1].useBrowserNetworkInterception).toBe(true)
          expect(browsersOpen().mock.lastCall![1].onPageCriClientReady).toBeTypeOf('function')
        })

        it('asks the launcher to clear persisted service workers on the browser network path', async () => {
          await openProject.launch(browser, spec)

          expect(browsersOpen().mock.lastCall![1].shouldClearPersistedServiceWorkers).toBe(true)
        })

        it('leaves persisted service workers alone when testIsolation is disabled', async () => {
          config.testIsolation = false

          await openProject.launch(browser, spec)

          expect(browsersOpen().mock.lastCall![1].shouldClearPersistedServiceWorkers).toBe(false)
        })

        it('does not ask the launcher to clear persisted service workers on the MITM path', async () => {
          await openProject.launch({ name: 'firefox', family: 'firefox' }, spec)

          expect(browsersOpen().mock.lastCall![1].shouldClearPersistedServiceWorkers).toBeUndefined()
        })

        it('passes the MITM path to the launcher when forceHttp1 is set', async () => {
          config.forceHttp1 = true

          await openProject.launch(browser, spec)

          expect(browsersOpen().mock.lastCall![1].useBrowserNetworkInterception).toBe(false)
          expect(browsersOpen().mock.lastCall![1].onPageCriClientReady).toBeUndefined()
        })

        it('passes the MITM path to the launcher for a non-chromium browser', async () => {
          await openProject.launch({ name: 'firefox', family: 'firefox' }, spec)

          expect(browsersOpen().mock.lastCall![1].useBrowserNetworkInterception).toBe(false)
        })

        // Electron is deprecated as a test browser, so it stays on the legacy
        // proxy even though it is chromium-family.
        it('passes the MITM path to the launcher for electron', async () => {
          await openProject.launch({ name: 'electron', family: 'chromium' }, spec)

          expect(browsersOpen().mock.lastCall![1].useBrowserNetworkInterception).toBe(false)
          expect(browsersOpen().mock.lastCall![1].onPageCriClientReady).toBeUndefined()
          expect(browsersOpen().mock.lastCall![1]).toEqual(expect.objectContaining({
            proxyServer: 'http://cy-proxy-server',
            proxyBypassList: '<-loopback>',
          }))
        })
      })

      describe('upstream proxy', () => {
        let proxyEnv: Record<string, string | undefined>

        beforeEach(() => {
          proxyEnv = {
            HTTP_PROXY: process.env.HTTP_PROXY,
            HTTPS_PROXY: process.env.HTTPS_PROXY,
            NO_PROXY: process.env.NO_PROXY,
          }

          delete process.env.HTTP_PROXY
          delete process.env.HTTPS_PROXY
          delete process.env.NO_PROXY
        })

        afterEach(() => {
          Object.entries(proxyEnv).forEach(([name, value]) => {
            if (value === undefined) {
              delete process.env[name]
            } else {
              process.env[name] = value
            }
          })
        })

        describe('on the MITM path', () => {
          it('proxies loopback through the cypress proxy when forceHttp1 is set', async () => {
            config.forceHttp1 = true
            process.env.HTTP_PROXY = 'http://proxy.example:8080'
            process.env.NO_PROXY = 'example.com'

            await openProject.launch(browser, spec)

            expect(browsersOpen().mock.lastCall![1]).toEqual(expect.objectContaining({
              proxyServer: 'http://cy-proxy-server',
              proxyBypassList: '<-loopback>',
            }))
          })

          // Firefox and WebKit have no browser network path, so they fall back even
          // with forceHttp1 unset.
          it('proxies loopback through the cypress proxy for non-chromium browsers', async () => {
            process.env.HTTP_PROXY = 'http://proxy.example:8080'
            process.env.NO_PROXY = 'example.com'

            await openProject.launch({ name: 'firefox', family: 'firefox' }, spec)

            expect(browsersOpen().mock.lastCall![1]).toEqual(expect.objectContaining({
              proxyServer: 'http://cy-proxy-server',
              proxyBypassList: '<-loopback>',
            }))
          })
        })

        describe('on the browser network path', () => {
          beforeEach(() => {
            delete config.proxyServer
          })

          it('does not pass proxyServer to browser without an upstream proxy', async () => {
            await openProject.launch(browser, spec)

            expect(browsersOpen().mock.lastCall![1].proxyServer).toBeUndefined()
          })

          it('passes the upstream proxy and bypass list to the browser', async () => {
            process.env.HTTP_PROXY = 'http://proxy.example:8080'
            process.env.NO_PROXY = '<-loopback>,example.com'
            config.hosts = { 'foo.example': '127.0.0.1' }

            await openProject.launch(browser, spec)

            expect(browsersOpen().mock.lastCall![1]).toEqual(expect.objectContaining({
              proxyServer: 'http://proxy.example:8080',
              proxyBypassList: 'example.com,foo.example',
            }))
          })
        })
      })
    })
  })

  describe('#sendFocusBrowserMessage', () => {
    it('focuses browser if runner is connected', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = vi.fn()
      vi.spyOn(ProjectBase.prototype, 'isRunnerSocketConnected').mockReturnValue(true)
      vi.spyOn(ProjectBase.prototype, 'sendFocusBrowserMessage').mockResolvedValue(undefined as any)

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).toHaveBeenCalledOnce()
      expect(ProjectBase.prototype.sendFocusBrowserMessage).toHaveBeenCalledOnce()
      expect(openProject.relaunchBrowser).not.toHaveBeenCalled()
    })

    it('relaunches browser if runner is not connected and relaunch exists', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = vi.fn()
      vi.spyOn(ProjectBase.prototype, 'isRunnerSocketConnected').mockReturnValue(false)
      vi.spyOn(ProjectBase.prototype, 'sendFocusBrowserMessage').mockResolvedValue(undefined as any)

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).toHaveBeenCalledOnce()
      expect(ProjectBase.prototype.sendFocusBrowserMessage).not.toHaveBeenCalled()
      expect(openProject.relaunchBrowser).toHaveBeenCalledOnce()
    })

    it('does not throw if relaunch is not defined', async () => {
      // Stubbing out relaunchBrowser function created during launch
      openProject.relaunchBrowser = null
      vi.spyOn(ProjectBase.prototype, 'isRunnerSocketConnected').mockReturnValue(false)
      vi.spyOn(ProjectBase.prototype, 'sendFocusBrowserMessage').mockResolvedValue(undefined as any)

      await openProject.sendFocusBrowserMessage()

      expect(ProjectBase.prototype.isRunnerSocketConnected).toHaveBeenCalledOnce()
      expect(ProjectBase.prototype.sendFocusBrowserMessage).not.toHaveBeenCalled()
    })
  })

  describe('#connectProtocolToBrowser', () => {
    it('connects protocol to browser', async () => {
      vi.spyOn(browsers, 'connectProtocolToBrowser').mockResolvedValue(undefined as any)
      const options = vi.fn() as any

      await openProject.connectProtocolToBrowser(options)

      expect(browsers.connectProtocolToBrowser).toHaveBeenCalledWith(options)
    })
  })

  describe('#connectCyPromptToBrowser', () => {
    it('connects cy prompt to browser', async () => {
      vi.spyOn(browsers, 'connectCyPromptToBrowser').mockResolvedValue(undefined as any)
      const options = vi.fn() as any

      await openProject.connectCyPromptToBrowser(options)
    })
  })

  describe('#closeActiveProject', () => {
    it('leaves the browser close unbounded when the process is not exiting', async () => {
      vi.spyOn(ProjectBase.prototype, 'close').mockResolvedValue(undefined as any)
      const closeBrowserStub = vi.spyOn(browsers, 'close').mockResolvedValue(undefined as any)

      // an earlier spec that stubbed process.exit can leave teardown marked as started
      GracefulExit.resetForTesting()

      await openProject.closeActiveProject()

      expect(closeBrowserStub).toHaveBeenCalledOnce()
      expect(closeBrowserStub.mock.calls[0][0].timeoutMs, 'a project switch has to wait for the browser to really be gone').toBeUndefined()
    })

    it('bounds the browser close when the process is exiting', async () => {
      vi.spyOn(ProjectBase.prototype, 'close').mockResolvedValue(undefined as any)
      const closeBrowserStub = vi.spyOn(browsers, 'close').mockResolvedValue(undefined as any)
      const exitStub = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

      // exitGracefully flushes every registered step; drop the ones other specs left behind so this
      // asserts on our own call
      GracefulExit.resetForTesting()

      // as a teardown step, the way it reaches this path in production (clearCtx -> ctx.destroy)
      GracefulExit.addStep(() => openProject.closeActiveProject(), 'close project')

      await GracefulExit.exitGracefully(0)

      expect(closeBrowserStub).toHaveBeenCalledOnce()
      expect(closeBrowserStub.mock.calls[0][0].timeoutMs, 'waiting on the browser unbounded spends the whole exit budget').toBeTypeOf('number')

      exitStub.mockRestore()
      GracefulExit.resetForTesting()
    })

    it('awaits projectBase.close before resetting and closing the browser', async () => {
      let resolveClose
      const closePromise = new Promise<void>((resolve) => {
        resolveClose = resolve
      })
      const closeStub = vi.spyOn(ProjectBase.prototype, 'close').mockReturnValue(closePromise as any)
      const closeBrowserStub = vi.spyOn(browsers, 'close').mockResolvedValue(undefined as any)

      const closing = openProject.closeActiveProject()

      expect(closeStub).toHaveBeenCalledOnce()
      expect(closeBrowserStub).not.toHaveBeenCalled()
      expect(openProject.getProject()).not.toBeNull()

      resolveClose()
      await closing

      expect(closeBrowserStub).toHaveBeenCalledOnce()
      expect(openProject.getProject()).toBeNull()
    })
  })
})
