import '../../spec_helper'

import stripAnsi from 'strip-ansi'
import os from 'os'
import chalk from 'chalk'
import browsers from '../../../lib/browsers'
import utils from '../../../lib/browsers/utils'
import snapshot from 'snap-shot-it'
import { EventEmitter } from 'events'
import { exec } from 'child_process'
import util from 'util'
import { createTestDataContext } from '../../support/helpers/data-context-helper'
import electron from '../../../lib/browsers/electron'
import chrome from '../../../lib/browsers/chrome'
import Promise from 'bluebird'
import { deferred } from '../../support/helpers/deferred'
import type { DataContext } from '@packages/data-context/src/DataContext'
import type { BrowserInstance } from '../../../lib/browsers/types'
import type { FoundBrowser, BrowserStatus } from '@packages/types/src/browser'

// Type for simplified browser objects used in tests
type TestBrowser = Pick<FoundBrowser, 'name' | 'channel'>

// Type for Cypress error objects used in tests
type CypressErrorType = {
  type: 'BROWSER_NOT_FOUND_BY_NAME'
  message?: string
}

// Type for URL strings used in tests
type TestUrl = 'http://localhost:3000'

// Type for sinon spy on setBrowserStatus
type SetBrowserStatusSpy = sinon.SinonSpy<[BrowserStatus], void>

// Type for minimal browser instance data used in setFocus tests
type MinimalBrowserData = {
  pid: number
}

// Type for electron browser objects used in tests
type TestElectronBrowser = {
  name: 'electron'
  family: 'chromium'
}

// Type for browser options array used in tests
type BrowserOptionsArray = Array<{ family: 'chromium' } | { url: string, onBrowserOpen?: () => void } | null | DataContext>

const normalizeSnapshot = (str: string) => {
  return snapshot(stripAnsi(str))
}

const BROWSER_LIST_REGEX = /(found on your system are:)(?:\n - .*)*/

const normalizeBrowsers = (message: string) => {
  return message.replace(BROWSER_LIST_REGEX, '$1\n - chrome\n - firefox\n - electron')
}

// When we added component testing mode, we added the option for electron to be omitted
type ProcessVersionsWithElectron = Omit<NodeJS.ProcessVersions, 'electron'> & {
  electron?: string | boolean | undefined
}

const processVersions = process.versions as ProcessVersionsWithElectron
const originalElectronVersion = processVersions.electron

before(() => {
  processVersions.electron = true
})

let ctx: DataContext

beforeEach(() => {
  ctx = createTestDataContext()
})

after(() => {
  processVersions.electron = originalElectronVersion
})

describe('lib/browsers/index', () => {
  context('.getBrowserInstance', () => {
    it('returns instance', () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      browserInstance.pid = 1234
      const instance = browserInstance

      browsers._setInstance(instance)

      expect(browsers.getBrowserInstance()).to.eq(instance)
    })

    it('returns undefined if no instance', () => {
      browsers._setInstance(null)

      expect(browsers.getBrowserInstance()).to.be.null
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
      const foundBrowsers: TestBrowser[] = [
        { name: 'foo', channel: 'stable' },
        { name: 'bar', channel: 'stable' },
      ]

      return browsers.ensureAndGetByNameOrPath('foo', false, foundBrowsers as FoundBrowser[])
      .then((browser: TestBrowser) => {
        expect(browser).to.deep.eq({ name: 'foo', channel: 'stable' })
      })
    })

    it('throws when no browser can be found', () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'firefox', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath('browserNotGonnaBeFound', false, foundBrowsers as FoundBrowser[]))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' } as any)
      .then((err: CypressErrorType) => {
        return normalizeSnapshot(normalizeBrowsers(stripAnsi(err.message)))
      })
    })

    it('throws a special error when canary is passed', () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'chrome', channel: 'canary' },
        { name: 'firefox', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath('canary', false, foundBrowsers as FoundBrowser[]))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' } as any)
      .then((err: CypressErrorType) => {
        return normalizeSnapshot(err.message)
      })
    })

    it('throws BROWSER_NOT_FOUND_BY_NAME when --browser is passed without a value', () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath(true as any, false, foundBrowsers as FoundBrowser[]))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' } as any)
    })

    it('throws BROWSER_NOT_FOUND_BY_NAME when nameOrPath is undefined', () => {
      const foundBrowsers: TestBrowser[] = [
        { name: 'chrome', channel: 'stable' },
        { name: 'electron', channel: 'stable' },
      ]

      return expect(browsers.ensureAndGetByNameOrPath(undefined as any, false, foundBrowsers as FoundBrowser[]))
      .to.be.rejectedWith({ type: 'BROWSER_NOT_FOUND_BY_NAME' } as any)
    })
  })

  context('.connectCyPromptToBrowser', () => {
    it('connects browser to cy prompt', async () => {
      sinon.stub(chrome, 'connectCyPromptToBrowser').resolves()
      await browsers.connectCyPromptToBrowser({
        browser: {
          family: 'chromium',
        },
      })

      expect(chrome.connectCyPromptToBrowser).to.be.called
    })
  })

  context('.connectStudioToBrowser', () => {
    it('connects browser to studio', async () => {
      sinon.stub(chrome, 'connectStudioToBrowser').resolves()
      await browsers.connectStudioToBrowser({
        browser: {
          family: 'chromium',
        },
        studioManager: {} as any,
      })

      expect(chrome.connectStudioToBrowser).to.be.called
    })
  })

  context('.closeProtocolConnection', () => {
    it('calls close on instance', async () => {
      sinon.stub(chrome, 'closeProtocolConnection').resolves()
      await browsers.closeProtocolConnection({
        browser: {
          family: 'chromium',
        } as any,
      })

      expect(chrome.closeProtocolConnection).to.be.called
    })
  })

  context('.connectToNewSpec', () => {
    it(`throws an error if browser family doesn't exist`, () => {
      return browsers.connectToNewSpec({
        name: 'foo-bad-bang',
        family: 'foo-bad',
      } as any, {
        browsers: [],
      } as any, null)
      .then((e: any) => {
        throw new Error('should\'ve failed')
      })
      .catch((err: CypressErrorType) => {
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
      } as any, {
        browsers: [],
      } as any, null, ctx)
      .then((e: any) => {
        throw new Error('should\'ve failed')
      })
      .catch((err: CypressErrorType) => {
        // by being explicit with assertions, if something is unexpected
        // we will get good error message that includes the "err" object
        expect(err).to.have.property('type').to.eq('BROWSER_NOT_FOUND_BY_NAME')

        expect(err).to.have.property('message').to.contain(`Browser: ${chalk.yellow('foo-bad-bang')} was not found on your system`)
      })
    })

    // https://github.com/cypress-io/cypress/issues/24377
    it('terminates orphaned browser if it connects while launching another instance', async () => {
      const browserOptions: BrowserOptionsArray = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter() as BrowserInstance

      browserInstance1.kill = sinon.stub()
      const chromeOpenStub = sinon.stub(chrome, 'open')

      chromeOpenStub.onCall(0).returns(launchBrowser1.promise as any)

      // attempt to launch browser
      const openBrowser1 = browsers.open.apply(null, browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter() as BrowserInstance

      browserInstance2.kill = sinon.stub()
      chromeOpenStub.onCall(1).returns(launchBrowser2.promise as any)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open.apply(null, browserOptions)

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
      const browserOptions: BrowserOptionsArray = [{
        family: 'chromium',
      }, {
        url: 'http://example.com',
        onBrowserOpen () {},
      }, null, ctx]

      const launchBrowser1 = deferred()
      const browserInstance1 = new EventEmitter() as BrowserInstance

      browserInstance1.kill = sinon.stub()
      const chromeOpenStub = sinon.stub(chrome, 'open')

      chromeOpenStub.onCall(0).returns(launchBrowser1.promise as any)

      // attempt to launch browser
      const openBrowser1 = browsers.open.apply(null, browserOptions)
      const launchBrowser2 = deferred()
      const browserInstance2 = new EventEmitter() as BrowserInstance

      browserInstance2.kill = sinon.stub()
      chromeOpenStub.onCall(1).returns(launchBrowser2.promise as any)

      // original browser launch times out, so we retry launching the browser
      const openBrowser2 = browsers.open.apply(null, browserOptions)

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
        return utils.extendLaunchOptionsFromPlugins({}, { foo: 'bar' }, {})
      }

      // this error is snapshotted in an e2e test, no need to do it here
      expect(fn).to.throw({ type: 'UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES' } as any)
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

      const browserData: MinimalBrowserData = {
        pid: 3333,
      }

      browsers._setInstance(browserData as any)

      browsers.setFocus()

      expect(util.promisify).to.be.calledWith(exec)
      expect(mockExec).to.be.calledWith(`open -a "$(ps -p 3333 -o comm=)"`)
    })

    it('calls WScript AppActivate to activate the window when running Windows', () => {
      const mockExec = sinon.stub()

      sinon.stub(os, 'platform').returns('win32')
      sinon.stub(util, 'promisify').returns(mockExec)

      const browserData: MinimalBrowserData = {
        pid: 3333,
      }

      browsers._setInstance(browserData as any)

      browsers.setFocus()

      expect(util.promisify).to.be.calledWith(exec)
      expect(mockExec).to.be.calledWith(`(New-Object -ComObject WScript.Shell).AppActivate(((Get-WmiObject -Class win32_process -Filter "ParentProcessID = '3333'") | Select -ExpandProperty ProcessId))`, { shell: 'powershell.exe' })
    })
  })

  context('kill', () => {
    it('allows registered emitter events to fire before kill', () => {
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const removeAllListenersSpy = sinon.spy(browserInstance, 'removeAllListeners')

      const instance = browserInstance

      browsers._setInstance(instance)

      const exitSpy = sinon.spy()

      browserInstance.once('exit', () => {
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
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      const browserData: TestElectronBrowser = {
        name: 'electron',
        family: 'chromium',
      }

      return browsers.open(browserData as any, { url } as any, null, ctx).then(browsers.close).then(() => {
        ['opening', 'open', 'closed'].forEach((status, i) => {
          expect((ctx.actions.app.setBrowserStatus as SetBrowserStatusSpy).getCall(i).args[0]).eq(status)
        })
      })
    })
  })

  context('didBrowserPreviouslyHaveUnexpectedExit', () => {
    it('sets didBrowserPreviouslyHaveUnexpectedExit when the browser unexpectedly closes', () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then(browsers.close).then(() => {
        expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).eq(true)
      })
    })
  })

  context('browser cleanup', () => {
    it('calls onBrowserClose callback on close', () => {
      const onBrowserClose = sinon.stub()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onBrowserClose } as any, null, ctx).then(() => {
        // Simulate browser exit
        browserInstance.emit('exit')

        expect(onBrowserClose).to.be.called
      })
    })

    it('calls onBrowserOpen callback', async () => {
      const onBrowserOpen = sinon.stub()
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url, onBrowserOpen } as any, null, ctx).then(() => {
        expect(onBrowserOpen).to.be.called
      })
    })

    it('waits a second to give browser time to open', async () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      const delayStub = sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then(() => {
        expect(delayStub).to.be.calledWith(1000)
      })
    })

    it('returns instance with kill and removeAllListeners functions', async () => {
      const url: TestUrl = 'http://localhost:3000'
      const browserInstance = new EventEmitter() as BrowserInstance

      browserInstance.kill = () => {
        browserInstance.emit('exit')
      }

      const instance = browserInstance

      browsers._setInstance(instance)

      sinon.stub(electron, 'open').resolves(instance)
      sinon.spy(ctx.actions.app, 'setBrowserStatus')

      // Stub to speed up test, we don't care about the delay
      sinon.stub(Promise, 'delay').resolves()

      return browsers.open({ name: 'electron', family: 'chromium' } as any, { url } as any, null, ctx).then((returnedInstance: BrowserInstance | null) => {
        expect(returnedInstance.kill).to.be.a('function')
        expect(returnedInstance.removeAllListeners).to.be.a('function')
      })
    })
  })
})
