require('../../spec_helper')

const os = require('os')
const mockfs = require('mock-fs')
const path = require('path')
const _ = require('lodash')

const extension = require('@packages/extension')
const launch = require('@packages/launcher/lib/browsers')
const plugins = require(`../../../lib/plugins`)
const utils = require(`../../../lib/browsers/utils`)
const chrome = require(`../../../lib/browsers/chrome`)
const { fs } = require(`../../../lib/util/fs`)
const CriClient = require('../../../lib/browsers/cri-client')

describe('lib/browsers/chrome', () => {
  context('#open', () => {
    beforeEach(function () {
      // mock CRI client during testing
      this.criClient = {
        ensureMinimumProtocolVersion: sinon.stub().resolves(),
        send: sinon.stub().resolves(),
        Page: {
          screencastFrame: sinon.stub().returns(),
        },
        close: sinon.stub().resolves(),
        on: sinon.stub(),
      }

      this.automation = {
        push: sinon.stub(),
        use: sinon.stub().returns(),
      }

      // mock launched browser child process object
      this.launchedBrowser = {
        kill: sinon.stub().returns(),
      }

      this.onCriEvent = (event, data, options) => {
        this.criClient.on.withArgs(event).yieldsAsync(data)

        return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', options, this.automation)
        .then(() => {
          this.criClient.on = undefined
        })
      }

      sinon.stub(chrome, '_writeExtension').resolves('/path/to/ext')
      sinon.stub(chrome, '_connectToChromeRemoteInterface').resolves(this.criClient)
      sinon.stub(plugins, 'execute').callThrough()
      sinon.stub(launch, 'launch').resolves(this.launchedBrowser)
      sinon.stub(utils, 'getProfileDir').returns('/profile/dir')
      sinon.stub(utils, 'ensureCleanCache').resolves('/profile/dir/CypressCache')

      this.readJson = sinon.stub(fs, 'readJson')
      this.readJson.withArgs('/profile/dir/Default/Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      this.readJson.withArgs('/profile/dir/Local State').rejects({ code: 'ENOENT' })

      // port for Chrome remote interface communication
      sinon.stub(utils, 'getPort').resolves(50505)
    })

    afterEach(function () {
      mockfs.restore()
      expect(this.criClient.ensureMinimumProtocolVersion).to.be.calledOnce
    })

    it('focuses on the page, calls CRI Page.visit, enables Page events, and sets download behavior', function () {
      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        expect(utils.getPort).to.have.been.calledOnce // to get remote interface port
        expect(this.criClient.send.callCount).to.equal(5)
        expect(this.criClient.send).to.have.been.calledWith('Page.bringToFront')

        expect(this.criClient.send).to.have.been.calledWith('Page.navigate')
        expect(this.criClient.send).to.have.been.calledWith('Page.enable')
        expect(this.criClient.send).to.have.been.calledWith('Page.setDownloadBehavior')
        expect(this.criClient.send).to.have.been.calledWith('Network.enable')
      })
    })

    it('is noop without before:browser:launch', function () {
      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        expect(plugins.execute).not.to.be.called
      })
    })

    it('is noop if newArgs are not returned', function () {
      const args = []

      sinon.stub(chrome, '_getArgs').returns(args)
      sinon.stub(plugins, 'has').returns(true)

      plugins.execute.resolves(null)

      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        // to initialize remote interface client and prepare for true tests
        // we load the browser with blank page first
        expect(launch.launch).to.be.calledWith({ isHeadless: true, isHeaded: false }, 'about:blank', 50505, args)
      })
    })

    it('sets default window size and DPR in headless mode', function () {
      chrome._writeExtension.restore()

      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--headless',
          '--window-size=1280,720',
          '--force-device-scale-factor=1',
        ])
      })
    })

    it('does not load extension in headless mode', function () {
      chrome._writeExtension.restore()

      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--headless',
          '--remote-debugging-port=50505',
          '--remote-debugging-address=127.0.0.1',
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])
      })
    })

    it('uses a custom profilePath if supplied', function () {
      chrome._writeExtension.restore()
      utils.getProfileDir.restore()

      const profilePath = '/home/foo/snap/chromium/current'
      const fullPath = `${profilePath}/Cypress/chromium-stable/interactive`

      this.readJson.withArgs(`${fullPath}/Default/Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Default/Secure Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Local State`).rejects({ code: 'ENOENT' })

      return chrome.open({
        isHeadless: true,
        isHeaded: false,
        profilePath,
        name: 'chromium',
        channel: 'stable',
      }, 'http://', {}, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          `--user-data-dir=${fullPath}`,
        ])
      })
    })

    it('DEPRECATED: normalizes --load-extension if provided in plugin', function () {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve(['--foo=bar', '--load-extension=/foo/bar/baz.js'])
      })

      const pathToTheme = extension.getPathToTheme()

      const onWarning = sinon.stub()

      return chrome.open({ isHeadless: false, isHeaded: true }, 'http://', { onWarning }, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.deep.eq([
          '--foo=bar',
          `--load-extension=/foo/bar/baz.js,/path/to/ext,${pathToTheme}`,
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])

        expect(onWarning).calledOnce
      })
    })

    it('normalizes --load-extension if provided in plugin', function () {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({
          args: ['--foo=bar', '--load-extension=/foo/bar/baz.js'],
        })
      })

      const pathToTheme = extension.getPathToTheme()

      return chrome.open({ isHeadless: false, isHeaded: true }, 'http://', {}, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--foo=bar',
          `--load-extension=/foo/bar/baz.js,/path/to/ext,${pathToTheme}`,
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])
      })
    })

    it('normalizes multiple extensions from plugins', function () {
      plugins.registerEvent('before:browser:launch', (browser, config) => {
        return Promise.resolve({ args: ['--foo=bar', '--load-extension=/foo/bar/baz.js,/quux.js'] })
      })

      const pathToTheme = extension.getPathToTheme()

      const onWarning = sinon.stub()

      return chrome.open({ isHeadless: false, isHeaded: true }, 'http://', { onWarning }, this.automation)
      .then(() => {
        const args = launch.launch.firstCall.args[3]

        expect(args).to.include.members([
          '--foo=bar',
          `--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,${pathToTheme}`,
          '--user-data-dir=/profile/dir',
          '--disk-cache-dir=/profile/dir/CypressCache',
        ])

        expect(onWarning).not.calledOnce
      })
    })

    it('install extension and ensure write access', function () {
      mockfs({
        [path.resolve(`${__dirname }../../../../../extension/dist`)]: {
          'background.js': mockfs.file({
            mode: 0o0444,
          }),
        },
      })

      const getFile = function (path) {
        return _.reduce(_.compact(_.split(path, '/')), (acc, item) => {
          return acc.getItem(item)
        }, mockfs.getMockRoot())
      }

      chrome._writeExtension.restore()
      utils.getProfileDir.restore()

      const profilePath = '/home/foo/snap/chromium/current'
      const fullPath = `${profilePath}/Cypress/chromium-stable/interactive`

      this.readJson.withArgs(`${fullPath}/Default/Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Default/Secure Preferences`).rejects({ code: 'ENOENT' })
      this.readJson.withArgs(`${fullPath}/Local State`).rejects({ code: 'ENOENT' })

      return chrome.open({
        isHeadless: false,
        isHeaded: false,
        profilePath,
        name: 'chromium',
        channel: 'stable',
      }, 'http://', {}, this.automation)
      .then(() => {
        expect((getFile(fullPath).getMode()) & 0o0700).to.be.above(0o0500)
      })
    })

    it('cleans up an unclean browser profile exit status', function () {
      this.readJson.withArgs('/profile/dir/Default/Preferences').resolves({
        profile: {
          exit_type: 'Abnormal',
          exited_cleanly: false,
        },
      })

      sinon.stub(fs, 'outputJson').resolves()

      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        expect(fs.outputJson).to.be.calledWith('/profile/dir/Default/Preferences', {
          profile: {
            exit_type: 'Normal',
            exited_cleanly: true,
          },
        })
      })
    })

    it('calls cri client close on kill', function () {
      // need a reference here since the stub will be monkey-patched
      const {
        kill,
      } = this.launchedBrowser

      return chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)
      .then(() => {
        expect(typeof this.launchedBrowser.kill).to.eq('function')

        this.launchedBrowser.kill()

        expect(this.criClient.close).to.be.calledOnce
        expect(kill).to.be.calledOnce
      })
    })

    it('rejects if CDP version check fails', function () {
      this.criClient.ensureMinimumProtocolVersion.rejects()

      return expect(chrome.open({ isHeadless: true, isHeaded: false }, 'http://', {}, this.automation)).to.be.rejectedWith('Cypress requires at least Chrome 64.')
    })

    // https://github.com/cypress-io/cypress/issues/9265
    it('respond ACK after receiving new screenshot frame', function () {
      const frameMeta = { data: Buffer.from(''), sessionId: '1' }
      const write = sinon.stub()
      const options = { onScreencastFrame: write }

      return this.onCriEvent('Page.screencastFrame', frameMeta, options)
      .then(() => {
        expect(this.criClient.send).to.have.been.calledWith('Page.startScreencast')
        expect(write).to.have.been.calledWith(frameMeta)
        expect(this.criClient.send).to.have.been.calledWith('Page.screencastFrameAck', { sessionId: frameMeta.sessionId })
      })
    })

    describe('downloads', function () {
      it('pushes create:download after download begins', function () {
        const downloadData = {
          guid: '1',
          suggestedFilename: 'file.csv',
          url: 'http://localhost:1234/file.csv',
        }
        const options = { downloadsFolder: 'downloads' }

        return this.onCriEvent('Page.downloadWillBegin', downloadData, options)
        .then(() => {
          expect(this.automation.push).to.be.calledWith('create:download', {
            id: '1',
            filePath: 'downloads/file.csv',
            mime: 'text/csv',
            url: 'http://localhost:1234/file.csv',
          })
        })
      })

      it('pushes complete:download after download completes', function () {
        const downloadData = {
          guid: '1',
          state: 'completed',
        }
        const options = { downloadsFolder: 'downloads' }

        return this.onCriEvent('Page.downloadProgress', downloadData, options)
        .then(() => {
          expect(this.automation.push).to.be.calledWith('complete:download', {
            id: '1',
          })
        })
      })
    })
  })

  context('#connectToNewSpec', () => {
    it('launches a new tab, connects a cri client to it, starts video, navigates to the spec url, and handles downloads', async function () {
      const criClient = {
        send: sinon.stub().resolves(),
        on: sinon.stub(),
      }
      const automation = {
        use: sinon.stub().returns(),
      }

      const options = { onError: () => {}, url: 'https://www.google.com', downloadsFolder: '/tmp/folder' }

      sinon.stub(CriClient, 'newTab').withArgs('127.0.0.1', 100, options.onError).resolves(criClient)
      sinon.stub(chrome, '_maybeRecordVideo').withArgs(criClient, options, 354).resolves()
      sinon.stub(chrome, '_navigateUsingCRI').withArgs(criClient, options.url, 354).resolves()
      sinon.stub(chrome, '_handleDownloads').withArgs(criClient, options.downloadFolder, automation).resolves()

      await chrome.connectToNewSpec({ majorVersion: 354 }, 100, options, automation)

      expect(CriClient.newTab).to.be.called
      expect(automation.use).to.be.called
      expect(chrome._maybeRecordVideo).to.be.called
      expect(chrome._navigateUsingCRI).to.be.called
      expect(chrome._handleDownloads).to.be.called
    })
  })

  context('#_getArgs', () => {
    it('disables gpu when linux', () => {
      sinon.stub(os, 'platform').returns('linux')

      const args = chrome._getArgs({}, {})

      expect(args).to.include('--disable-gpu')
    })

    it('does not disable gpu when not linux', () => {
      sinon.stub(os, 'platform').returns('darwin')

      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--disable-gpu')
    })

    it('turns off sandbox when linux', () => {
      sinon.stub(os, 'platform').returns('linux')

      const args = chrome._getArgs({}, {})

      expect(args).to.include('--no-sandbox')
    })

    it('does not turn off sandbox when not linux', () => {
      sinon.stub(os, 'platform').returns('win32')

      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--no-sandbox')
    })

    it('adds user agent when options.userAgent', () => {
      const args = chrome._getArgs({}, {
        userAgent: 'foo',
      })

      expect(args).to.include('--user-agent=foo')
    })

    it('does not add user agent', () => {
      const args = chrome._getArgs({}, {})

      expect(args).not.to.include('--user-agent=foo')
    })

    it('disables RootLayerScrolling in versions 66 or 67', () => {
      const arg = '--disable-blink-features=RootLayerScrolling'

      const disabledRootLayerScrolling = function (version, bool) {
        const args = chrome._getArgs({
          majorVersion: version,
        }, {})

        if (bool) {
          return expect(args).to.include(arg)
        }

        expect(args).not.to.include(arg)
      }

      disabledRootLayerScrolling('65', false)
      disabledRootLayerScrolling('66', true)
      disabledRootLayerScrolling('67', true)

      disabledRootLayerScrolling('68', false)
    })

    // https://github.com/cypress-io/cypress/issues/1872
    it('adds <-loopback> proxy bypass rule in version 72+', () => {
      const arg = '--proxy-bypass-list=<-loopback>'

      const chromeVersionHasLoopback = function (version, bool) {
        const args = chrome._getArgs({
          majorVersion: version,
        }, {})

        if (bool) {
          return expect(args).to.include(arg)
        }

        expect(args).not.to.include(arg)
      }

      chromeVersionHasLoopback('71', false)
      chromeVersionHasLoopback('72', true)

      return chromeVersionHasLoopback('73', true)
    })
  })

  context('#_getChromePreferences', () => {
    it('returns map of empty if the files do not exist', () => {
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Local State').rejects({ code: 'ENOENT' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: {},
        defaultSecure: {},
        localState: {},
      })
    })

    it('returns map of json objects if the files do exist', () => {
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').resolves({ foo: 'bar' })
      .withArgs('/foo/Default/Secure Preferences').resolves({ bar: 'baz' })
      .withArgs('/foo/Local State').resolves({ baz: 'quux' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: { foo: 'bar' },
        defaultSecure: { bar: 'baz' },
        localState: { baz: 'quux' },
      })
    })
  })

  context('#_mergeChromePreferences', () => {
    it('merges as expected', () => {
      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      }

      const expected = {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          foo: 'bar',
        },
        localState: {},
      }

      expect(chrome._mergeChromePreferences(originalPrefs, newPrefs)).to.deep.eq(expected)
    })
  })

  context('#_writeChromePreferences', () => {
    it('writes json as expected', () => {
      const outputJson = sinon.stub(fs, 'outputJson')
      const defaultPrefs = outputJson.withArgs('/foo/Default/Preferences').resolves()
      const securePrefs = outputJson.withArgs('/foo/Default/Secure Preferences').resolves()
      const statePrefs = outputJson.withArgs('/foo/Local State').resolves()

      const originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar',
          deleteThis: 'nephew',
        },
        localState: {},
      }

      const newPrefs = chrome._mergeChromePreferences(originalPrefs, {
        default: {
          something: {
            nested: 'here',
          },
        },
        defaultSecure: {
          deleteThis: null,
        },
        someGarbage: true,
      })

      expect(chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)).to.eventually.equal()
      .then(() => {
        expect(defaultPrefs).to.be.calledWith('/foo/Default/Preferences', {
          something: {
            nested: 'here',
          },
        })

        expect(securePrefs).to.be.calledWith('/foo/Default/Secure Preferences', {
          foo: 'bar',
        })

        // no changes were made
        expect(statePrefs).to.not.be.called
      })
    })
  })
})
