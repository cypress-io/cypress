require('../../spec_helper')

const info = require(`../../../lib/modes/info`)
const capture = require(`../../../lib/capture`)
const browserUtils = require(`../../../lib/browsers/utils`)
const { fs } = require(`../../../lib/util/fs`)
const detect = require('@packages/launcher/lib/detect')
const snapshot = require('snap-shot-it')
const stripAnsi = require('strip-ansi')

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
    // so Chrome will be picked first (index 0), Firefox will be second (index 1)
    const randomStub = sinon.stub(Math, 'random')

    randomStub.onFirstCall().returns(0)
    randomStub.onSecondCall().returns(0.99)

    await infoAndSnapshot('two browsers')
    expect(randomStub.callCount, 'two browsers were picked to create examples').to.be.gte(2)
  })

  it('sorts browsers by name then major version', async () => {
    const browsers = [
      { displayName: 'Firefox', name: 'firefox', channel: 'stable', version: '100.0', majorVersion: '100', path: '/path/firefox' },
      { displayName: 'Chrome', name: 'chrome', channel: 'stable', version: '120.0', majorVersion: '120', path: '/path/chrome120' },
      { displayName: 'Chrome', name: 'chrome', channel: 'stable', version: '110.0', majorVersion: '110', path: '/path/chrome110' },
    ]

    sinon.stub(detect, 'detect').resolves(browsers)

    browserUtils.getBrowserPath
    .withArgs(browsers[0]).returns('/path/to/user/firefox/profile')
    .withArgs(browsers[1]).returns('/path/to/user/chrome120/profile')
    .withArgs(browsers[2]).returns('/path/to/user/chrome110/profile')

    const captured = capture.stdout()

    await info()

    capture.restore()
    const output = stripAnsi(captured.toString())

    // Chrome 110 should come before Chrome 120 (same name, sorted by majorVersion)
    // Both Chromes should come before Firefox (sorted by name)
    const chrome110Idx = output.indexOf('110.0')
    const chrome120Idx = output.indexOf('120.0')
    const firefoxIdx = output.indexOf('Firefox')

    expect(chrome110Idx).to.be.lessThan(chrome120Idx)
    expect(chrome120Idx).to.be.lessThan(firefoxIdx)
  })

  it('adds profile for browser if folder exists', async () => {
    sinon.stub(detect, 'detect').resolves([chromeStable, firefoxDev])

    sinon.stub(fs, 'statAsync')
    .withArgs('/path/to/user/chrome/profile').throws('No Chrome profile folder')
    .withArgs('/path/to/user/firefox/profile').resolves({
      isDirectory: () => true,
    })

    // have to make sure random sampling from the browser list
    // to create examples returns same order
    // so Chrome will be picked first (index 0), Firefox will be second (index 1)
    const randomStub = sinon.stub(Math, 'random')

    randomStub.onFirstCall().returns(0)
    randomStub.onSecondCall().returns(0.99)

    await infoAndSnapshot('two browsers with firefox having profile folder')
  })
})
