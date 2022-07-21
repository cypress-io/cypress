require('../../spec_helper')

const _ = require('lodash')
const os = require('os')
const electron = require('electron')
const DataContext = require('@packages/data-context')
const savedState = require(`../../../lib/saved_state`)
const menu = require(`../../../lib/gui/menu`)
const Events = require(`../../../lib/gui/events`)
const Windows = require(`../../../lib/gui/windows`)
const interactiveMode = require(`../../../lib/modes/interactive`)

describe('gui/interactive', () => {
  context('.isMac', () => {
    it('returns true if os.platform is darwin', () => {
      sinon.stub(os, 'platform').returns('darwin')

      expect(interactiveMode.isMac()).to.be.true
    })

    it('returns false if os.platform isnt darwin', () => {
      sinon.stub(os, 'platform').returns('linux64')

      expect(interactiveMode.isMac()).to.be.false
    })
  })

  context('.getWindowArgs', () => {
    it('quits app when onClose is called', () => {
      electron.app.quit = sinon.stub()
      interactiveMode.getWindowArgs({}).onClose()

      expect(electron.app.quit).to.be.called
    })

    it('tracks state properties', () => {
      const { trackState } = interactiveMode.getWindowArgs({})

      const args = _.pick(trackState, 'width', 'height', 'x', 'y', 'devTools')

      expect(args).to.deep.eq({
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
          expect(interactiveMode.getWindowArgs({}).width).to.equal(1200)
        })

        it('renders with preferred height if no height saved', () => {
          expect(interactiveMode.getWindowArgs({}).height).to.equal(800)
        })
      })

      describe('when saved dimension is too small', () => {
        it('uses the preferred width', () => {
          expect(interactiveMode.getWindowArgs({ appWidth: 1 }).width).to.equal(1200)
        })

        it('uses the preferred height', () => {
          expect(interactiveMode.getWindowArgs({ appHeight: 1 }).height).to.equal(800)
        })
      })

      describe('when saved dimension is within min/max dimension', () => {
        it('uses the saved width', () => {
          expect(interactiveMode.getWindowArgs({ appWidth: 1500 }).width).to.equal(1500)
        })

        it('uses the saved height', () => {
          expect(interactiveMode.getWindowArgs({ appHeight: 1500 }).height).to.equal(1500)
        })
      })
    })

    it('renders with saved x if it exists', () => {
      expect(interactiveMode.getWindowArgs({ appX: 3 }).x).to.equal(3)
    })

    it('renders with no x if no x saved', () => {
      expect(interactiveMode.getWindowArgs({}).x).to.be.undefined
    })

    it('renders with saved y if it exists', () => {
      expect(interactiveMode.getWindowArgs({ appY: 4 }).y).to.equal(4)
    })

    it('renders with no y if no y saved', () => {
      expect(interactiveMode.getWindowArgs({}).y).to.be.undefined
    })

    describe('on window focus', () => {
      beforeEach(() => {
        sinon.stub(menu, 'set')
      })

      it('calls menu.set withInternalDevTools: true when in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'development'
        interactiveMode.getWindowArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.true
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })

      it('calls menu.set withInternalDevTools: false when not in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'production'
        interactiveMode.getWindowArgs({}).onFocus()
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.false
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })
  })

  context('.ready', () => {
    beforeEach(function () {
      this.win = {}
      this.state = {}

      sinon.stub(menu, 'set')
      sinon.stub(Events, 'start')
      sinon.stub(Windows, 'open').resolves(this.win)
      sinon.stub(Windows, 'trackState')

      const state = savedState.create()

      sinon.stub(state, 'get').resolves(this.state)
    })

    it('calls Events.start with options, adding env, onFocusTests, and os', () => {
      sinon.stub(os, 'platform').returns('someOs')
      const opts = {}

      return interactiveMode.ready(opts).then(() => {
        expect(Events.start).to.be.called
        expect(Events.start.lastCall.args[0].onFocusTests).to.be.a('function')

        expect(Events.start.lastCall.args[0].os).to.equal('someOs')
      })
    })

    it('calls menu.set', () => {
      return interactiveMode.ready({}).then(() => {
        expect(menu.set).to.be.calledOnce
      })
    })

    it('calls menu.set withInternalDevTools: true when in dev env', () => {
      const env = process.env['CYPRESS_INTERNAL_ENV']

      process.env['CYPRESS_INTERNAL_ENV'] = 'development'

      return interactiveMode.ready({}).then(() => {
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.true
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })

    it('calls menu.set withInternalDevTools: false when not in dev env', () => {
      const env = process.env['CYPRESS_INTERNAL_ENV']

      process.env['CYPRESS_INTERNAL_ENV'] = 'production'

      return interactiveMode.ready({}).then(() => {
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.false
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })

    it('resolves with win', function () {
      return interactiveMode.ready({}).then((win) => {
        expect(win).to.eq(this.win)
      })
    })
  })

  context('.run', () => {
    beforeEach(() => {
      sinon.stub(electron.app, 'whenReady').resolves()
    })

    it('calls ready with options', () => {
      sinon.stub(interactiveMode, 'ready')

      const opts = {}

      return interactiveMode.run(opts).then(() => {
        expect(interactiveMode.ready).to.be.calledWith(opts)
      })
    })

    describe('data context management', () => {
      let willQuitHandler
      let clearCtxImmediateCallback

      let mockEvent = {
        preventDefault: sinon.stub(),
      }

      let performAssertions = () => {
        const opts = {}

        return interactiveMode.run(opts).then(() => {
          expect(interactiveMode.ready).to.be.calledWith(opts)
        }).then(async () => {
          expect(willQuitHandler).to.be.defined

          willQuitHandler(mockEvent)
          expect(mockEvent.preventDefault).to.have.been.called
          expect(clearCtxImmediateCallback).to.be.defined

          await clearCtxImmediateCallback()

          expect(DataContext.clearCtx).to.have.been.called
          expect(electron.app.quit).to.have.been.called
        })
      }

      beforeEach(() => {
        willQuitHandler = undefined
        clearCtxImmediateCallback = undefined

        sinon.stub(interactiveMode, 'ready')
        sinon.stub(electron.app, 'once').callsFake((eventName, handler) => {
          if (eventName === 'will-quit') {
            willQuitHandler = handler
          }
        })

        sinon.stub(global, 'setImmediate').callsFake((callback) => {
          // we intercept the setImmediate call so we can synchronously
          // execute the callback in the test and await its result
          clearCtxImmediateCallback = callback
        })

        electron.app.quit = sinon.stub()
      })

      it('uses will-quit listener to destroy DataContext before exiting', () => {
        sinon.stub(DataContext, 'clearCtx').resolves()

        return performAssertions()
      })

      it('still quits if destroying DataContext throws error', () => {
        sinon.stub(DataContext, 'clearCtx').rejects()

        return performAssertions()
      })
    })
  })
})
