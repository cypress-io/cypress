import _ from 'lodash'
import os from 'os'
import electron from 'electron'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as savedState from '../../../lib/saved_state'
import menu from '../../../lib/gui/menu'
import * as Windows from '../../../lib/gui/windows'
import interactiveMode from '../../../lib/modes/interactive'
import { GracefulExit } from '../../../lib/util/graceful-exit'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../../lib/makeDataContext'

vi.mock('electron', () => {
  const electronMock = {
    app: {
      on () {},
      async whenReady () {},
    },
    nativeImage: {
      createFromPath () {
        return {}
      },
    },
  }

  return { ...electronMock, default: electronMock }
})

// Building the real schemas in this worker loads a second `graphql` realm, which `graphql` rejects.
vi.mock('@packages/data-context/graphql/schema', () => {
  return { graphqlSchema: {} }
})

vi.mock('@packages/data-context/graphql', () => {
  return { remoteSchemaWrapped: {} }
})

// vite loads this file's `../src` import as a second data-context instance that never sees `setCtx`.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return { makeGraphQLServer: async () => 4444 }
})

describe('gui/interactive', () => {
  const originalInternalEnv = process.env.CYPRESS_INTERNAL_ENV

  beforeEach(async () => {
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()
    process.env.CYPRESS_INTERNAL_ENV = originalInternalEnv
  })

  describe('.isMac', () => {
    it('returns true if os.platform is darwin', () => {
      vi.spyOn(os, 'platform').mockReturnValue('darwin')

      expect(interactiveMode.isMac()).toBe(true)
    })

    it('returns false if os.platform isnt darwin', () => {
      vi.spyOn(os, 'platform').mockReturnValue('linux64' as NodeJS.Platform)

      expect(interactiveMode.isMac()).toBe(false)
    })
  })

  describe('.getWindowArgs', () => {
    it('quits app when onClose is called', () => {
      electron.app.quit = vi.fn()
      interactiveMode.getWindowArgs('http://app', {}).onClose()

      expect(electron.app.quit).toHaveBeenCalled()
    })

    it('tracks state properties', () => {
      const { trackState } = interactiveMode.getWindowArgs('http://app', {})

      const args = _.pick(trackState, 'width', 'height', 'x', 'y', 'devTools')

      expect(args).toEqual({
        width: 'appWidth',
        height: 'appHeight',
        x: 'appX',
        y: 'appY',
        devTools: 'isAppDevToolsOpen',
      })
    })

    describe('width + height dimensions', () => {
      // Choose preferred if you have no valid choice
      // Use the saved value if it's valid
      describe('when no dimension', () => {
        it('renders with preferred width if no width saved', () => {
          expect(interactiveMode.getWindowArgs('http://app', {}).width).toBe(1200)
        })

        it('renders with preferred height if no height saved', () => {
          expect(interactiveMode.getWindowArgs('http://app', {}).height).toBe(800)
        })
      })

      describe('when saved dimension is too small', () => {
        it('uses the preferred width', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appWidth: 1 }).width).toBe(1200)
        })

        it('uses the preferred height', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appHeight: 1 }).height).toBe(800)
        })
      })

      describe('when saved dimension is within min/max dimension', () => {
        it('uses the saved width', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appWidth: 1500 }).width).toBe(1500)
        })

        it('uses the saved height', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appHeight: 1500 }).height).toBe(1500)
        })
      })
    })

    it('renders with saved x if it exists', () => {
      expect(interactiveMode.getWindowArgs('http://app', { appX: 3 }).x).toBe(3)
    })

    it('renders with no x if no x saved', () => {
      expect(interactiveMode.getWindowArgs('http://app', {}).x).toBeUndefined()
    })

    it('renders with saved y if it exists', () => {
      expect(interactiveMode.getWindowArgs('http://app', { appY: 4 }).y).toBe(4)
    })

    it('renders with no y if no y saved', () => {
      expect(interactiveMode.getWindowArgs('http://app', {}).y).toBeUndefined()
    })

    describe('on window focus', () => {
      beforeEach(() => {
        vi.spyOn(menu, 'set').mockImplementation(() => {})
      })

      it('calls menu.set withInternalDevTools: true when in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'development'
        interactiveMode.getWindowArgs('http://app', {}).onFocus()
        expect(vi.mocked(menu.set).mock.lastCall![0].withInternalDevTools).toBe(true)
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })

      it('calls menu.set withInternalDevTools: false when not in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'production'
        interactiveMode.getWindowArgs('http://app', {}).onFocus()
        expect(vi.mocked(menu.set).mock.lastCall![0].withInternalDevTools).toBe(false)
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })
  })

  describe('.ready', () => {
    let win
    let stateValue

    beforeEach(async () => {
      win = {}
      stateValue = {}

      vi.spyOn(menu, 'set').mockImplementation(() => {})
      vi.spyOn(Windows, 'open').mockResolvedValue(win)
      vi.spyOn(Windows, 'trackState').mockImplementation(() => {})

      const state = await savedState.create()

      vi.spyOn(state, 'get').mockResolvedValue(stateValue)
    })

    it('calls menu.set', () => {
      return interactiveMode.ready({}).then(() => {
        expect(menu.set).toHaveBeenCalledTimes(1)
      })
    })

    it('calls menu.set withInternalDevTools: true when in dev env', () => {
      const env = process.env['CYPRESS_INTERNAL_ENV']

      process.env['CYPRESS_INTERNAL_ENV'] = 'development'

      return interactiveMode.ready({}).then(() => {
        expect(vi.mocked(menu.set).mock.lastCall![0].withInternalDevTools).toBe(true)
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })

    it('calls menu.set withInternalDevTools: false when not in dev env', () => {
      const env = process.env['CYPRESS_INTERNAL_ENV']

      process.env['CYPRESS_INTERNAL_ENV'] = 'production'

      return interactiveMode.ready({}).then(() => {
        expect(vi.mocked(menu.set).mock.lastCall![0].withInternalDevTools).toBe(false)
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })

    it('resolves with win', () => {
      return interactiveMode.ready({}).then((readyWin) => {
        expect(readyWin).toBe(win)
      })
    })
  })

  describe('.run', () => {
    beforeEach(() => {
      vi.spyOn(electron.app, 'whenReady').mockResolvedValue()
    })

    it('calls ready with options', () => {
      vi.spyOn(interactiveMode, 'ready').mockImplementation(async () => undefined as any)

      const opts = {}

      return interactiveMode.run(opts).then(() => {
        expect(interactiveMode.ready).toHaveBeenCalledWith(opts, expect.any(Number))
      })
    })

    describe('data context management', () => {
      let beforeQuitHandler
      let quitTeardownImmediateCallback

      let mockEvent = {
        preventDefault: vi.fn(),
      }

      let performAssertions = () => {
        const opts = {}

        return interactiveMode.run(opts).then(() => {
          expect(interactiveMode.ready).toHaveBeenCalledWith(opts, expect.any(Number))
        }).then(async () => {
          expect(beforeQuitHandler).toBeDefined()

          beforeQuitHandler(mockEvent)
          expect(mockEvent.preventDefault).toHaveBeenCalled()
          expect(quitTeardownImmediateCallback).toBeDefined()

          await quitTeardownImmediateCallback()

          expect(GracefulExit.exitGracefully).toHaveBeenCalledWith(0)
        })
      }

      beforeEach(() => {
        beforeQuitHandler = undefined
        quitTeardownImmediateCallback = undefined

        vi.spyOn(interactiveMode, 'ready').mockImplementation(async () => undefined as any)
        vi.spyOn(electron.app, 'on').mockImplementation((eventName, handler) => {
          if (eventName === 'before-quit') {
            beforeQuitHandler = handler
          }
        })

        vi.spyOn(GracefulExit, 'exitGracefully').mockResolvedValue()

        vi.spyOn(global, 'setImmediate').mockImplementation((callback) => {
          // we intercept the setImmediate call so we can synchronously
          // execute the callback in the test and await its result
          quitTeardownImmediateCallback = callback

          return undefined as any
        })

        electron.app.quit = vi.fn()
      })

      it('uses before-quit listener and invokes graceful exit', () => {
        return performAssertions()
      })

      it('exits with code 1 when graceful exit fails during quit teardown', () => {
        vi.mocked(GracefulExit.exitGracefully).mockRejectedValue(new Error('teardown failed'))
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

        const opts = {}

        return interactiveMode.run(opts).then(() => {
          expect(interactiveMode.ready).toHaveBeenCalledWith(opts, expect.any(Number))
        }).then(async () => {
          beforeQuitHandler(mockEvent)
          await quitTeardownImmediateCallback()

          expect(process.exit).toHaveBeenCalledWith(1)
        })
      })
    })
  })
})
