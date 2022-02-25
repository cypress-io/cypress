require('../../spec_helper')

const info = require(`../../../lib/modes/info`)
const capture = require(`../../../lib/capture`)
const browserUtils = require(`../../../lib/browsers/utils`)
const { fs } = require(`../../../lib/util/fs`)
const detect = require('@packages/launcher/lib/detect')
const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')
const _ = require('lodash')

describe('lib/modes/info', () => {
  beforeEach(() => {
    capture.restore()

    sinon.stub(browserUtils, 'getBrowserPath')
    .withArgs(chromeStable).returns('/path/to/user/chrome/profile')
    .withArgs(firefoxDev).returns('/path/to/user/firefox/profile')
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
    sinon.stub(detect, 'detect').resolves([])
    await infoAndSnapshot('output without any browsers')
  })

  it('prints 1 found browser', async () => {
    sinon.stub(detect, 'detect').resolves([chromeStable])

    await infoAndSnapshot('single chrome:stable')
  })

  it('prints 2 found browsers', async () => {
    sinon.stub(detect, 'detect').resolves([chromeStable, firefoxDev])
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
    sinon.stub(detect, 'detect').resolves([chromeStable, firefoxDev])

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
