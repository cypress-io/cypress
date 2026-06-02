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
  })

  // TODO: test everything else going on in this method!

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
