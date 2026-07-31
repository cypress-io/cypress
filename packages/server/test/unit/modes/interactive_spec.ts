import '../../spec_helper'
import _ from 'lodash'
import os from 'os'
import electron from 'electron'
import * as savedState from '../../../lib/saved_state'
import menu from '../../../lib/gui/menu'
import * as Windows from '../../../lib/gui/windows'
import interactiveMode from '../../../lib/modes/interactive'
import { GracefulExit } from '../../../lib/util/graceful-exit'

describe('gui/interactive', () => {
  describe('.isMac', () => {
    it('returns true if os.platform is darwin', () => {
      sinon.stub(os, 'platform').returns('darwin')

      expect(interactiveMode.isMac()).to.be.true
    })

    it('returns false if os.platform isnt darwin', () => {
      sinon.stub(os, 'platform').returns('linux64')

      expect(interactiveMode.isMac()).to.be.false
    })
  })

  describe('.getWindowArgs', () => {
    it('quits app when onClose is called', () => {
      electron.app.quit = sinon.stub()
      interactiveMode.getWindowArgs('http://app', {}).onClose()

      expect(electron.app.quit).to.be.called
    })

    it('tracks state properties', () => {
      const { trackState } = interactiveMode.getWindowArgs('http://app', {})

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
          expect(interactiveMode.getWindowArgs('http://app', {}).width).to.equal(1200)
        })

        it('renders with preferred height if no height saved', () => {
          expect(interactiveMode.getWindowArgs('http://app', {}).height).to.equal(800)
        })
      })

      describe('when saved dimension is too small', () => {
        it('uses the preferred width', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appWidth: 1 }).width).to.equal(1200)
        })

        it('uses the preferred height', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appHeight: 1 }).height).to.equal(800)
        })
      })

      describe('when saved dimension is within min/max dimension', () => {
        it('uses the saved width', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appWidth: 1500 }).width).to.equal(1500)
        })

        it('uses the saved height', () => {
          expect(interactiveMode.getWindowArgs('http://app', { appHeight: 1500 }).height).to.equal(1500)
        })
      })
    })

    it('renders with saved x if it exists', () => {
      expect(interactiveMode.getWindowArgs('http://app', { appX: 3 }).x).to.equal(3)
    })

    it('renders with no x if no x saved', () => {
      expect(interactiveMode.getWindowArgs('http://app', {}).x).to.be.undefined
    })

    it('renders with saved y if it exists', () => {
      expect(interactiveMode.getWindowArgs('http://app', { appY: 4 }).y).to.equal(4)
    })

    it('renders with no y if no y saved', () => {
      expect(interactiveMode.getWindowArgs('http://app', {}).y).to.be.undefined
    })

    describe('on window focus', () => {
      beforeEach(() => {
        sinon.stub(menu, 'set')
      })

      it('calls menu.set withInternalDevTools: true when in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'development'
        interactiveMode.getWindowArgs('http://app', {}).onFocus()
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.true
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })

      it('calls menu.set withInternalDevTools: false when not in dev env', () => {
        const env = process.env['CYPRESS_INTERNAL_ENV']

        process.env['CYPRESS_INTERNAL_ENV'] = 'production'
        interactiveMode.getWindowArgs('http://app', {}).onFocus()
        expect(menu.set.lastCall.args[0].withInternalDevTools).to.be.false
        process.env['CYPRESS_INTERNAL_ENV'] = env
      })
    })
  })

  describe('.ready', () => {
    beforeEach(async function () {
      this.win = {}
      this.state = {}

      sinon.stub(menu, 'set')
      sinon.stub(Windows, 'open').resolves(this.win)
      sinon.stub(Windows, 'trackState')

      const state = await savedState.create()

      sinon.stub(state, 'get').resolves(this.state)
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

  describe('.run', () => {
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
      let beforeQuitHandler
      let quitTeardownImmediateCallback

      let mockEvent = {
        preventDefault: sinon.stub(),
      }

      let performAssertions = () => {
        const opts = {}

        return interactiveMode.run(opts).then(() => {
          expect(interactiveMode.ready).to.be.calledWith(opts)
        }).then(async () => {
          expect(beforeQuitHandler).to.exist

          beforeQuitHandler(mockEvent)
          expect(mockEvent.preventDefault).to.have.been.called
          expect(quitTeardownImmediateCallback).to.exist

          await quitTeardownImmediateCallback()

          expect(GracefulExit.exitGracefully).to.have.been.calledWith(0)
        })
      }

      beforeEach(() => {
        beforeQuitHandler = undefined
        quitTeardownImmediateCallback = undefined

        sinon.stub(interactiveMode, 'ready')
        sinon.stub(electron.app, 'on').callsFake((eventName, handler) => {
          if (eventName === 'before-quit') {
            beforeQuitHandler = handler
          }
        })

        sinon.stub(GracefulExit, 'exitGracefully').resolves()

        sinon.stub(global, 'setImmediate').callsFake((callback) => {
          // we intercept the setImmediate call so we can synchronously
          // execute the callback in the test and await its result
          quitTeardownImmediateCallback = callback
        })

        electron.app.quit = sinon.stub()
      })

      it('uses before-quit listener and invokes graceful exit', () => {
        return performAssertions()
      })

      it('exits with code 1 when graceful exit fails during quit teardown', () => {
        GracefulExit.exitGracefully.restore()
        sinon.stub(GracefulExit, 'exitGracefully').rejects(new Error('teardown failed'))
        sinon.stub(process, 'exit')

        const opts = {}

        return interactiveMode.run(opts).then(() => {
          expect(interactiveMode.ready).to.be.calledWith(opts)
        }).then(async () => {
          beforeQuitHandler(mockEvent)
          await quitTeardownImmediateCallback()

          expect(process.exit).to.have.been.calledWith(1)
        })
      })
    })
  })
})
