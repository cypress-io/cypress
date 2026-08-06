import '../../spec_helper'

import { expect } from 'chai'
import 'sinon-chai'

import _ from 'lodash'
import Promise from 'bluebird'
import { EventEmitter } from 'events'
import { BrowserWindow } from 'electron'
import * as Windows from '../../../lib/gui/windows'
import * as savedState from '../../../lib/saved_state'

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Cypress/0.0.0 Chrome/59.0.3071.115 Electron/1.8.2 Safari/537.36'

describe('lib/gui/windows', () => {
  beforeEach(function () {
    Windows.reset()

    this.win = new EventEmitter()
    this.win.loadURL = sinon.stub()
    this.win.destroy = sinon.stub()
    this.win.getSize = sinon.stub().returns([1, 2])
    this.win.getPosition = sinon.stub().returns([3, 4])
    this.win.webContents = new EventEmitter()
    this.win.webContents.openDevTools = sinon.stub()
    this.win.webContents.setWindowOpenHandler = sinon.stub()
    this.win.webContents.userAgent = DEFAULT_USER_AGENT
    this.win.isDestroyed = sinon.stub().returns(false)
    this.win.focusOnWebView = sinon.stub()
  })

  afterEach(() => {
    return Windows.reset()
  })

  context('.getByWebContents', () => {
    it('calls BrowserWindow.fromWebContents', () => {
      sinon.stub(BrowserWindow, 'fromWebContents').withArgs('foo' as any).returns('bar' as any)

      expect(Windows.getByWebContents('foo')).to.eq('bar')
    })
  })

  context('.open', () => {
    it('sets default options', function () {
      const options: Windows.WindowOpenOptions = {
        type: 'INDEX',
        url: 'foo',
      }

      return Windows.open('/path/to/project', options, () => this.win)
      .then((win) => {
        expect(options).to.include({
          height: 500,
          width: 600,
          type: 'INDEX',
          show: true,
        })

        expect(win.loadURL).to.be.calledWith('foo')
      })
    })
  })

  context('.create', () => {
    it('opens dev tools if saved state is open', function () {
      Windows.create('/foo/', { devTools: true }, () => this.win)
      expect(this.win.webContents.openDevTools).to.be.called

      Windows.create('/foo/', {}, () => this.win)

      expect(this.win.webContents.openDevTools).not.to.be.calledTwice
    })

    it('derives webPreferences.webSecurity from chromeWebSecurity', function () {
      const newBrowserWindow = sinon.stub().returns(this.win)

      Windows.create('/foo/', { chromeWebSecurity: true }, newBrowserWindow)
      expect(newBrowserWindow.lastCall.args[0].webPreferences.webSecurity).to.be.true

      Windows.create('/foo/', { chromeWebSecurity: false }, newBrowserWindow)

      expect(newBrowserWindow.lastCall.args[0].webPreferences.webSecurity).to.be.false
    })

    it('denies the window open request and delegates to onNewWindow', function () {
      const onNewWindow = sinon.stub()

      Windows.create('/foo/', { onNewWindow }, () => this.win)

      const handler = this.win.webContents.setWindowOpenHandler.lastCall.args[0]
      const details = { url: 'some://other.url' }

      expect(handler(details)).to.deep.eq({ action: 'deny' })
      expect(onNewWindow).to.be.calledOn(this.win)
      expect(onNewWindow).to.be.calledWith(details)
    })

    it('applies the partition to webPreferences', function () {
      const newBrowserWindow = sinon.stub().returns(this.win)

      Windows.create('/foo/', { partition: 'persist:interactive' }, newBrowserWindow)

      expect(newBrowserWindow.lastCall.args[0].webPreferences.partition).to.eq('persist:interactive')
    })

    // the webview loses focus on navigation, so a hidden window has to refocus it
    // https://github.com/cypress-io/cypress/issues/2190
    it('refocuses the webview when a hidden window navigates', function () {
      Windows.create('/foo/', { show: false }, () => this.win)

      this.win.webContents.emit('did-start-loading')

      expect(this.win.focusOnWebView).to.be.called
    })

    it('does not refocus the webview once the window is destroyed', function () {
      this.win.isDestroyed.returns(true)

      Windows.create('/foo/', { show: false }, () => this.win)

      this.win.webContents.emit('did-start-loading')

      expect(this.win.focusOnWebView).not.to.be.called
    })

    it('does not refocus the webview when the window is shown', function () {
      Windows.create('/foo/', { show: true }, () => this.win)

      this.win.webContents.emit('did-start-loading')

      expect(this.win.focusOnWebView).not.to.be.called
    })

    it('invokes onCrashed when the render process goes away', function () {
      const onCrashed = sinon.stub()
      const details = { reason: 'crashed' }

      Windows.create('/foo/', { onCrashed }, () => this.win)

      this.win.webContents.emit('render-process-gone', details)

      expect(onCrashed).to.be.calledOn(this.win)
      expect(onCrashed).to.be.calledWith(details)
    })

    it('invokes onFocus and onBlur on the window', function () {
      const onFocus = sinon.stub()
      const onBlur = sinon.stub()

      Windows.create('/foo/', { onFocus, onBlur }, () => this.win)

      this.win.emit('focus')
      this.win.emit('blur')

      expect(onFocus).to.be.calledOn(this.win)
      expect(onBlur).to.be.calledOn(this.win)
    })

    it('removes the window listeners and invokes onClose once the window closes', function () {
      const onClose = sinon.stub()

      sinon.spy(this.win, 'removeAllListeners')

      Windows.create('/foo/', { onClose }, () => this.win)

      this.win.emit('closed')

      expect(this.win.removeAllListeners).to.be.called
      expect(onClose).to.be.calledOn(this.win)
    })
  })

  context('.trackState', () => {
    beforeEach(function () {
      return savedState.create()
      .then((state) => {
        this.state = state
        sinon.stub(this.state, 'set')

        this.projectRoot = undefined

        this.keys = {
          width: 'theWidth',
          height: 'someHeight',
          x: 'anX',
          y: 'aY',
          devTools: 'whatsUpwithInternalDevTools',
        }
      })
    })

    it('saves size and position when window resizes, debounced', function () {
      // tried using useFakeTimers here, but it didn't work for some
      // reason, so this is the next best thing
      sinon.stub(_, 'debounce').returnsArg(0)

      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.emit('resize')

      expect(_.debounce).to.be.called

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).to.be.calledWith({
          theWidth: 1,
          someHeight: 2,
          anX: 3,
          aY: 4,
        })
      })
    })

    it('returns if window isDestroyed on resize', function () {
      this.win.isDestroyed.returns(true)

      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.emit('resize')

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).not.to.be.called
      })
    })

    it('saves position when window moves, debounced', function () {
      // tried using useFakeTimers here, but it didn't work for some
      // reason, so this is the next best thing
      sinon.stub(_, 'debounce').returnsArg(0)
      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.emit('moved')

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).to.be.calledWith({
          anX: 3,
          aY: 4,
        })
      })
    })

    it('returns if window isDestroyed on moved', function () {
      this.win.isDestroyed.returns(true)

      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.emit('moved')

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).not.to.be.called
      })
    })

    it('saves dev tools state when opened', function () {
      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.webContents.emit('devtools-opened')

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).to.be.calledWith({ whatsUpwithInternalDevTools: true })
      })
    })

    it('saves dev tools state when closed', function () {
      Windows.trackState(this.projectRoot, false, this.win, this.keys)
      this.win.webContents.emit('devtools-closed')

      return Promise
      .delay(100)
      .then(() => {
        expect(this.state.set).to.be.calledWith({ whatsUpwithInternalDevTools: false })
      })
    })
  })
})
