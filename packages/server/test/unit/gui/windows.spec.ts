import _ from 'lodash'
import Promise from 'bluebird'
import { EventEmitter } from 'events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserWindow } from 'electron'
import * as Windows from '../../../lib/gui/windows'
import * as savedState from '../../../lib/saved_state'

vi.mock('electron', () => {
  return {
    BrowserWindow: {
      fromWebContents () {},
    },
  }
})

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0 Chrome/59.0.3071.115 Electron/1.8.2 Safari/537.36'

describe('lib/gui/windows', () => {
  let win

  beforeEach(() => {
    Windows.reset()

    win = new EventEmitter()
    win.loadURL = vi.fn()
    win.destroy = vi.fn()
    win.getSize = vi.fn(() => [1, 2])
    win.getPosition = vi.fn(() => [3, 4])
    win.webContents = new EventEmitter()
    win.webContents.openDevTools = vi.fn()
    win.webContents.setWindowOpenHandler = vi.fn()
    win.webContents.userAgent = DEFAULT_USER_AGENT
    win.isDestroyed = vi.fn(() => false)
  })

  afterEach(() => {
    vi.restoreAllMocks()

    return Windows.reset()
  })

  describe('.getByWebContents', () => {
    it('calls BrowserWindow.fromWebContents', () => {
      vi.spyOn(BrowserWindow, 'fromWebContents').mockImplementation((webContents) => {
        return (webContents as unknown) === 'foo' ? 'bar' as any : undefined
      })

      expect(Windows.getByWebContents('foo')).toBe('bar')
    })
  })

  describe('.open', () => {
    it('sets default options', () => {
      const options: Windows.WindowOpenOptions = {
        type: 'INDEX',
        url: 'foo',
      }

      return Windows.open('/path/to/project', options, () => win)
      .then((win) => {
        expect(options).toMatchObject({
          height: 500,
          width: 600,
          type: 'INDEX',
          show: true,
        })

        expect(win.loadURL).toHaveBeenCalledWith('foo')
      })
    })
  })

  describe('.create', () => {
    it('builds a hidden window without a frame or a thick frame', () => {
      let options

      Windows.create('/foo/', { show: false }, (opts) => {
        options = opts

        return win
      })

      expect(options).toMatchObject({
        frame: false,
        thickFrame: false,
      })
    })

    it('opens dev tools if saved state is open', () => {
      Windows.create('/foo/', { devTools: true }, () => win)
      expect(win.webContents.openDevTools).toHaveBeenCalled()

      Windows.create('/foo/', {}, () => win)

      expect(win.webContents.openDevTools).not.toHaveBeenCalledTimes(2)
    })
  })

  // TODO: test everything else going on in this method!

  describe('.trackState', () => {
    let state
    let projectRoot
    let keys

    beforeEach(() => {
      return savedState.create()
      .then((_state) => {
        state = _state
        vi.spyOn(state, 'set').mockImplementation(() => {})

        projectRoot = undefined

        keys = {
          width: 'theWidth',
          height: 'someHeight',
          x: 'anX',
          y: 'aY',
          devTools: 'whatsUpwithInternalDevTools',
        }
      })
    })

    it('saves size and position when window resizes, debounced', () => {
      // tried using useFakeTimers here, but it didn't work for some
      // reason, so this is the next best thing
      vi.spyOn(_, 'debounce').mockImplementation(((fn) => fn) as typeof _.debounce)

      Windows.trackState(projectRoot, false, win, keys)
      win.emit('resize')

      expect(_.debounce).toHaveBeenCalled()

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).toHaveBeenCalledWith({
          theWidth: 1,
          someHeight: 2,
          anX: 3,
          aY: 4,
        })
      })
    })

    it('returns if window isDestroyed on resize', () => {
      win.isDestroyed.mockReturnValue(true)

      Windows.trackState(projectRoot, false, win, keys)
      win.emit('resize')

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).not.toHaveBeenCalled()
      })
    })

    it('saves position when window moves, debounced', () => {
      // tried using useFakeTimers here, but it didn't work for some
      // reason, so this is the next best thing
      vi.spyOn(_, 'debounce').mockImplementation(((fn) => fn) as typeof _.debounce)
      Windows.trackState(projectRoot, false, win, keys)
      win.emit('moved')

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).toHaveBeenCalledWith({
          anX: 3,
          aY: 4,
        })
      })
    })

    it('returns if window isDestroyed on moved', () => {
      win.isDestroyed.mockReturnValue(true)

      Windows.trackState(projectRoot, false, win, keys)
      win.emit('moved')

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).not.toHaveBeenCalled()
      })
    })

    it('saves dev tools state when opened', () => {
      Windows.trackState(projectRoot, false, win, keys)
      win.webContents.emit('devtools-opened')

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).toHaveBeenCalledWith({ whatsUpwithInternalDevTools: true })
      })
    })

    it('saves dev tools state when closed', () => {
      Windows.trackState(projectRoot, false, win, keys)
      win.webContents.emit('devtools-closed')

      return Promise
      .delay(100)
      .then(() => {
        expect(state.set).toHaveBeenCalledWith({ whatsUpwithInternalDevTools: false })
      })
    })
  })
})
