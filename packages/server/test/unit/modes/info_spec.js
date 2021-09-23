require('../../spec_helper')

const capture = require('../../../lib/capture')
const { fs } = require('../../../lib/util/fs')
const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')
const _ = require('lodash')

const { stubable } = require('../../specUtils')
const proxyquire = require('proxyquire')
const browserUtils = stubable(require('../../../lib/browsers/utils'))

browserUtils.getBrowserPath = function (browser) {
  if (browser.name === 'chrome') {
    return null
  }

  if (browser.name === 'firefox') {
    return '/path/to/user/firefox/profile'
  }
}

const launcher = stubable(require('@packages/launcher'))
const info = proxyquire('../../../lib/modes/info', {
  '../browsers/utils': browserUtils,
  '@packages/launcher': launcher,
})

describe('lib/modes/info', () => {
  beforeEach(() => {
    capture.restore()
  })

  afterEach(() => {
    capture.restore()
  })

  const chromeStable = {
    displayName: 'Chrome',
    name: 'chrome',
    channel: 'stable',
    version: '12.34.56',
    majorVersion: 12,
    path: '/path/to/google-chrome',
  }

  const firefoxDev = {
    displayName: 'Firefox Dev',
    name: 'firefox',
    channel: 'dev',
    version: '79.0a1',
    majorVersion: 79,
    path: '/path/to/firefox',
  }

  const infoAndSnapshot = async (snapshotName) => {
    expect(snapshotName, 'missing snapshot name').to.be.a('string')

    const captured = capture.stdout()

    await info()

    capture.restore()
    snapshot(snapshotName, stripAnsi(captured.toString()))
  }

  it('prints no browsers', async () => {
    sinon.stub(launcher, 'detect').resolves([])
    await infoAndSnapshot('output without any browsers')
  })

  it('prints 1 found browser', async () => {
    sinon.stub(launcher, 'detect').resolves([chromeStable])
    await infoAndSnapshot('single chrome:stable')
  })

  it('prints 2 found browsers', async () => {
    sinon.stub(launcher, 'detect').resolves([chromeStable, firefoxDev])
    // have to make sure random sampling from the browser list
    // to create examples returns same order
    // so Chrome will be picked first, Firefox will be second
    const sample = sinon.stub(_, 'sample')

    sample.onFirstCall().returns(chromeStable)
    sample.onSecondCall().returns(firefoxDev)

    await infoAndSnapshot('two browsers')
    expect(sample, 'two browsers were picked to create examples').to.be.calledTwice
  })

  it('adds profile for browser if folder exists', async () => {
    sinon.stub(launcher, 'detect').resolves([chromeStable, firefoxDev])

    sinon.stub(fs, 'statAsync')
    .withArgs('/path/to/user/chrome/profile').throws('No Chrome profile folder')
    .withArgs('/path/to/user/firefox/profile').resolves({
      isDirectory: _.stubTrue,
    })

    // have to make sure random sampling from the browser list
    // to create examples returns same order
    // so Chrome will be picked first, Firefox will be second
    const sample = sinon.stub(_, 'sample')

    sample.onFirstCall().returns(chromeStable)
    sample.onSecondCall().returns(firefoxDev)

    await infoAndSnapshot('two browsers with firefox having profile folder')
  })
})
