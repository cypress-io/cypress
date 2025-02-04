require('../../spec_helper')

const stripAnsi = require('strip-ansi')
const os = require('os')
const chalk = require('chalk')
const browsers = require(`../../../lib/browsers`)
const utils = require(`../../../lib/browsers/utils`)
const snapshot = require('snap-shot-it')
const { EventEmitter } = require('events')
const { sinon } = require('../../spec_helper')
const { exec } = require('child_process')
const util = require('util')
const { createTestDataContext } = require('@packages/data-context/test/unit/helper')
const electron = require('../../../lib/browsers/electron')
const chrome = require('../../../lib/browsers/chrome')
const Promise = require('bluebird')
const { deferred } = require('../../support/helpers/deferred')

const normalizeSnapshot = (str) => {
  return snapshot(stripAnsi(str))
}

const normalizeBrowsers = (message) => {
  return message.replace(/(found on your system are:)(?:\n - .*)*/, '$1\n - chrome\n - firefox\n - electron')
}

// When we added component testing mode, we added the option for electron to be omitted
const originalElectronVersion = process.versions.electron

before(() => {
  process.versions.electron = true
})

let ctx

beforeEach(() => {
  ctx = createTestDataContext()
})

after(() => {
  process.versions.electron = originalElectronVersion
})

describe('lib/browsers/index', () => {
  context('.getBrowserInstance', () => {
    it('returns instance', () => {
      const ee = new EventEmitter()

      ee.kill = () => {
        ee.emit('exit')
      }

      ee.pid = 1234
      const instance = ee

      browsers._setInstance(instance)

      expect(browsers.getBrowserInstance()).to.eq(instance)
    })

    it('returns undefined if no instance', () => {
      browsers._setInstance()

      expect(browsers.getBrowserInstance()).to.be.undefined
    })
  })

  context('.isBrowserFamily', () => {
    it('allows only known browsers', () => {
      expect(browsers.isBrowserFamily('chromium')).to.be.true
      expect(browsers.isBrowserFamily('firefox')).to.be.true
      expect(browsers.isBrowserFamily('chrome')).to.be.false
      expect(browsers.isBrowserFamily('electron')).to.be.false

      expect(browsers.isBrowserFamily('my-favorite-browser')).to.be.false
    })
  })

  context('.ensureAndGetByNameOrPath', () => {
    it('returns browser by name', () => {
      const foundBrowsers = [
        { name: 'foo', channel: 'stable' },
        { name: 'bar', channel: 'stable' },
      ]

      return browsers.ensureAndGetByNameOrPath('foo', false, foundBrowsers)
      .then((browser) => {
        expect(browser).to.deep.eq({ name: 'foo', channel: 'stable' })
      })
    })

    it('throws when no browser can be found', () => {
      const foundBrowsers = [
        { name: 'chrome', channel: 'stable' },
        { name: 'firefox', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath('browserNotGonnaBeFound', false, foundBrowsers))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
      .then((err) => {
        return normalizeSnapshot(normalizeBrowsers(stripAnsi(err.message)))
      })
    })

    it('throws a special error when canary is passed', () => {
      const foundBrowsers = [
        { name: 'chrome', channel: 'stable' },
        { name: 'chrome', channel: 'canary' },
        { name: 'firefox', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath('canary', false, foundBrowsers))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' })
      .then((err) => {
        return normalizeSnapshot(err.message)
      })
    })
  })

  context('.connectToNewSpec', () => {
    it(`throws an error if browser family doesn't exist`, () => {
      return browsers.connectToNewSpec({
        name: 'foo-bad-bang',
        family: 'foo-bad',
      }, {
        browsers: [],
      })
      .then((e) => {
        throw new Error('should\'ve failed')
      })
      .catch((err) => {
        // by being explicit with assertions, if something is unexpected
        // we will get good error message that includes the "err" object
        expect(err).to.have.property('type').to.eq('BROWSER_NOT_FOUND_BY_NAME')

        expect(err).to.have.property('message').to.contain(`Browser: ${chalk.yellow('foo-bad-bang')} was not found on your system or is not supported by Cypress.`)
      })
    })
  })

  context('.open', () => {
    it(`throws an error if browser family doesn't exist`, () => {
      return browsers.open({
        name: 'foo-bad-bang',
        family: 'foo-bad',
      }, {
        browsers: [],
      }, null, ctx)
      .then((e) => {
        throw new Error('should\'ve failed')
      })
      .catch((err) => {
        // by being explicit with assertions, if something is unexpected
        // we will get good error message that includes the "err" object
        expect(err).to.have.property('type').to.eq('BROWSER_NOT_FOUND_BY_NAME')

        expect(err).to.have.property('message').to.contain(`Browser: ${chalk.yellow('foo-bad-bang')} was not found on your system`)
      })
    })

    // https://github.com/cypress-io/cypress/issues/24377
    it('terminates orphaned browser if it connects while launching another instance', async () => {
      const browserOptions = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter()

      browserInstance1.kill = sinon.stub()
      sinon.stub(chrome, 'open').onCall(0).returns(launchBrowser1.promise)

      // attempt to launch browser
      const openBrowser1 = browsers.open(...browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter()

      browserInstance2.kill = sinon.stub()
      chrome.open.onCall(1).returns(launchBrowser2.promise)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open(...browserOptions)

      // in the meantime, the 1st browser launches
      launchBrowser1.resolve(browserInstance1)
      // allow time for 1st browser to set instance before allowing 2nd
      // browser launch to move forward
      await Promise.delay(10)
      // the 2nd browser launches
      launchBrowser2.resolve(browserInstance2)
      // if we exit too soon, it will clear the instance in `open`'s exit
      // handler and not trigger the condition we're looking for
      await Promise.delay(10)
      // finishes killing the 1st browser
      browserInstance1.emit('exit')

      await openBrowser1
      await openBrowser2

      const currentInstance = browsers.getBrowserInstance()

      // clear out instance or afterEach hook will try to kill it and
      // it won't resolve. make sure this is before the assertions or
      // a failing one will prevent it from happening
      browsers._setInstance(null)

      expect(browserInstance1.kill).to.be.calledOnce
      expect(browserInstance1.isOrphanedBrowserProcess).to.be.true
      expect(currentInstance).to.equal(browserInstance2)
    })

    // https://github.com/cypress-io/cypress/issues/24377
    it('terminates orphaned browser if it connects after another instance launches', async () => {
      const browserOptions = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter()

      browserInstance1.kill = sinon.stub()
      sinon.stub(chrome, 'open').onCall(0).returns(launchBrowser1.promise)

      // attempt to launch browser
      const openBrowser1 = browsers.open(...browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter()

      browserInstance2.kill = sinon.stub()
      chrome.open.onCall(1).returns(launchBrowser2.promise)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open(...browserOptions)

      // the 2nd browser launches
      launchBrowser2.resolve(browserInstance2)

      await openBrowser2

      // but then the 1st browser launches
      launchBrowser1.resolve(browserInstance1)

      // wait a tick for exit listener to be set up, then send 'exit'
      await Promise.delay(10)
      // it should be killed (asserted below)
      // this finishes killing the 1st browser
      browserInstance1.emit('exit')

      await openBrowser1

      const currentInstance = browsers.getBrowserInstance()

      // clear out instance or afterEach hook will try to kill it and
      // it won't resolve. make sure this is before the assertions or
      // a failing one will prevent it from happening
      browsers._setInstance(null)

      expect(browserInstance1.kill).to.be.calledOnce
      expect(browserInstance1.isOrphanedBrowserProcess).to.be.true
      expect(currentInstance).to.equal(browserInstance2)
    })
  })

  context('.extendLaunchOptionsFromPlugins', () => {
    it('throws an error if unexpected property passed', () => {
      const fn = () => {
        return utils.extendLaunchOptionsFromPlugins({}, { foo: 'bar' })
      }

      // this error is snapshotted in an e2e test, no need to do it here
      expect(fn).to.throw({ type: 'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES' })
    })
  })

  context('.getMajorVersion', () => {
    it('returns first number when string of numbers', () => {
      expect(utils.getMajorVersion('91.0.4472.106')).to.eq(91) // Chromium format
      expect(utils.getMajorVersion('91.0a1')).to.eq(91) // Firefox format
    })

    it('is empty string when empty string', () => {
      expect(utils.getMajorVersion('')).to.eq('') // fallback if no version
    })

    // https://github.com/cypress-io/cypress/issues/15485
    it('returns version when unconventional version format', () => {
      const vers = 'VMware Fusion 12.1.0'

      expect(utils.getMajorVersion(vers)).to.eq(vers)
    })
  })

  context('setFocus', () => {
    it('calls open when running MacOS', () => {
      const mockExec = sinon.stub()

      sinon.stub(os, 'platform').returns('darwin')
      sinon.stub(util, 'promisify').returns(mockExec)

      browsers._setInstance({
        pid: 3333,
      })

      browsers.setFocus()

      expect(util.promisify).to.be.calledWith(exec)
      expect(mockExec).to.be.calledWith(`open -a "$(ps -p 3333 -o comm=)"`)
    })

    it('calls WScript AppActivate to activate the window when running Windows', () => {
      const mockExec = sinon.stub()

      sinon.stub(os, 'platform').returns('win32')
      sinon.stub(util, 'promisify').returns(mockExec)

      browsers._setInstance({
        pid: 3333,
      })

      browsers.setFocus()

      expect(util.promisify).to.be.calledWith(exec)
      expect(mockExec).to.be.calledWith(`(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '3333'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' })
    })
  })

  context('kill', () => {
    it('allows registered emitter events to fire before kill', () => {
      const ee = new EventEmitter()

      ee.kill = () => {
        ee.emit('exit')
      }

      const removeAllListenersSpy = sinon.spy(ee, 'removeAllListeners')

      const instance = ee

      browsers._setInstance(instance)

      const exitSpy = sinon.spy()

      ee.once('exit', () => {
        exitSpy()
      })

      return browsers.close().then(() => {
        expect(exitSpy.calledBefore(removeAllListenersSpy)).to.be.true
        expect(browsers.getBrowserInstance()).to.eq(null)
      })
    })
  })

  context('browserStatus', () => {
    it('calls setBrowserStatus with correct lifecycle state', () => {
      const url = 'http://localhost:3000'
      const ee = new EventEmitter()

      ee.kill = () => {
        ee.emit('exit')
      }

      const instance = ee

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' }, { url }, null, ctx).then(browsers.close).then(() => {
        ['opening', 'open', 'closed'].forEach((status, i) => {
          expect(ctx.actions.app.setBrowserStatus.getCall(i).args[0]).eq(status)
        })
      })
    })
  })

  context('didBrowserPreviouslyHaveUnexpectedExit', () => {
    it('sets didBrowserPreviouslyHaveUnexpectedExit when the browser unexpectedly closes', () => {
      const url = 'http://localhost:3000'
      const ee = new EventEmitter()

      ee.kill = () => {
        ee.emit('exit')
      }

      const instance = ee

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' }, { url }, null, ctx).then(browsers.close).then(() => {
        expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).eq(true)
      })
    })
  })
})

// Ooo, browser clean up tests are disabled?!!

// it "calls onBrowserClose callback on close", ->
//   onBrowserClose = sinon.stub()
//   browsers.launch("electron", @url, {onBrowserClose}).then ->
//     Windows.create.lastCall.args[0].onClose()
//     expect(onBrowserClose).to.be.called
//
// it "calls onBrowserOpen callback", ->
//    onBrowserOpen = sinon.stub()
//    browsers.launch("electron", @url, {onBrowserOpen}).then =>
//      expect(onBrowserOpen).to.be.called
//
// it "waits a second to give browser time to open", ->
//   browsers.launch("electron").then ->
//     expect(Promise.delay).to.be.calledWith(1000)
//
// it "returns 'instance'", ->
//   browsers.launch("electron").then (instance) ->
//     expect(instance.kill).to.be.a("function")
//     expect(instance.removeAllListeners).to.be.a("function")
//
// it "closes window on kill if it's not destroyed", ->
//   @win.isDestroyed.returns(false)
//   browsers.launch("electron").then (instance) =>
//     instance.kill()
//     expect(@win.close).to.be.called
//
// it "does not close window on kill if it's destroyed", ->
//   @win.isDestroyed.returns(true)
//   browsers.launch("electron").then (instance) =>
//     instance.kill()
//     expect(@win.close).not.to.be.called
