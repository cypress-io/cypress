import fs from 'fs'
import fsExtra from 'fs-extra'
import { run } from '../../lib/modes/run'
import { ProjectConfigIpc } from '@packages/data-context/src/data/ProjectConfigIpc'
import { FileDataSource } from '@packages/data-context/src/sources/FileDataSource'
import browserUtils from '../../lib/browsers'
import { fs as fsUtil } from '../../lib/util/fs'
import { getCtx } from '../../lib/makeDataContext'
import { OpenProject } from '../../lib/open_project'

describe('lib/modes/run', () => {
  let browserConnectTimeoutPlaceholder
  let ctx
  let specs = ['foo.cy.ts', 'bar.cy.ts', 'baz.cy.ts']
  let options = {
    autoCancelAfterFailures: undefined,
    browser: 'chrome',
    ciBuildId: undefined,
    exit: false,
    group: undefined,
    headed: false,
    key: undefined,
    outputPath: '',
    parallel: undefined,
    projectRoot: '/path/to/project/root',
    quiet: false,
    record: false,
    socketId: 'foobarbaz',
    spec: specs,
    tag: undefined,
    testingType: 'e2e',
    webSecurity: true,
  }

  beforeEach(() => {
    browserConnectTimeoutPlaceholder = process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT
    process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT = '2000'
    specs = ['foo.cy.ts', 'bar.cy.ts', 'baz.cy.ts']

    options = {
      autoCancelAfterFailures: undefined,
      browser: 'chrome',
      ciBuildId: undefined,
      exit: false,
      group: undefined,
      headed: false,
      key: undefined,
      onError: (err: Error) => undefined,
      outputPath: '',
      parallel: undefined,
      projectRoot: '/path/to/project/root',
      quiet: false,
      record: false,
      socketId: 'foobarbaz',
      spec: specs,
      tag: undefined,
      testingType: 'e2e',
      webSecurity: true,
    }

    const mockedRelativeSupportFilePath = 'cypress/support/e2e.js'

    const chromeStable = {
      displayName: 'Chrome',
      name: 'chrome',
      channel: 'stable',
      version: '12.34.56',
      majorVersion: '12',
      family: 'chromium',
      path: '/path/to/google-chrome',
    }

    const foundBrowsers = [
      chromeStable,
    ]

    sinon.stub(browserUtils, 'get').resolves(foundBrowsers)
    sinon.stub(browserUtils, 'removeOldProfiles').resolves()

    sinon.stub(fsUtil, 'access').withArgs(options.projectRoot).resolves()
    sinon.stub(process, 'chdir').withArgs(options.projectRoot).returns()
    // @ts-expect-error
    sinon.stub(fs, 'statSync').withArgs(options.projectRoot).returns({
      isDirectory: () => true,
    })

    // @ts-expect-error
    sinon.stub(fsExtra, 'pathExists').withArgs(`${options.projectRoot}/${mockedRelativeSupportFilePath}`).resolves(true)
    /// mock the project config IPC loadConfig to avoid communicating over sub processes, which will not work here since we are mocking the directory
    // @ts-expect-error
    sinon.stub(ProjectConfigIpc.prototype, 'loadConfig').callsFake(() => {
      return Promise.resolve({
        requires: [],
        initialConfig: '{}',
      })
    })

    sinon.stub(FileDataSource.prototype, 'getFilesByGlob').withArgs(options.projectRoot, 'cypress/support/e2e.{js,jsx,ts,tsx}').resolves([`${options.projectRoot}/${mockedRelativeSupportFilePath}`])

    ctx = getCtx()

    ctx.coreData.machineBrowsers = Promise.resolve(foundBrowsers)
    ctx.project._specs = specs

    // mock the websocket connection
    globalThis.CY_TEST_MOCK = {
      waitForSocketConnection: true,
      listenForProjectEnd: { stats: { failures: 0 } },
    }
  })

  afterEach(() => {
    delete globalThis['CY_TEST_MOCK']
    process.env.CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT = browserConnectTimeoutPlaceholder
  })

  it('recovers when the browser is closed unexpectedly by not sending "shouldLaunchNewTab" on newly created browser instances (creates the CRI client in the actual implementation)', async () => {
    let launchAttemptOfBarSpec = 0

    // @ts-expect-error
    sinon.stub(OpenProject.prototype, 'launch').callsFake((_browser, spec, browserOpts) => {
      switch (spec as unknown as string) {
        case 'foo.cy.ts':
          // should be a fresh launch of the browser, so shouldLaunchNewTab should be false
          expect(browserOpts.shouldLaunchNewTab).to.equal(false)
          // pass the first spec

          return Promise.resolve()
        case 'bar.cy.ts':
          launchAttemptOfBarSpec++
          if (launchAttemptOfBarSpec === 1) {
            // we are on our first launch of the browser. We are going to mock
            // the browser unexpectedly closing out of our control
            expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).to.equal(false)
            // since this is not the first spec launched in the browser, we should launch with a new tab and NOT a new browser instance
            expect(browserOpts.shouldLaunchNewTab).to.equal(true)

            // mock unexpected close of browser in second spec
            // return nothing as this promise should never resolve
            ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit = true

            return new Promise(((resolve) => {
              // never resolves as we are mocking the browser unexpectedly closing
            }))
          }

          // assume we are second launch attempt or later. We should have detected that the browser
          // previously exited and that we need to recreate everything related to the instance, so
          // shouldLaunchNewTab should be false
          expect(ctx.coreData.didBrowserPreviouslyHaveUnexpectedExit).to.equal(false)
          expect(browserOpts.shouldLaunchNewTab).to.equal(false)

          return Promise.resolve()
        case 'baz.cy.ts':
          return Promise.resolve()
        default:
          return Promise.resolve()
      }
    })

    await run(options, Promise.resolve())
  })
})
