require('../../spec_helper')

const info = require(`${root}../lib/modes/info`)
const launcher = require('@packages/launcher')

describe.only('lib/modes/info', () => {
  const chromeStable = {
    displayName: 'Chrome',
    name: 'chrome',
    channel: 'stable',
    version: '12.34.56',
    majorVersion: 12,
    path: '/path/to/google-chrome',
  }

  const exampleBrowsers = [chromeStable]

  it('prints no browsers', async () => {
    sinon.stub(launcher, 'detect').resolves([])
    await info()
  })

  it('prints 1 found browser', async () => {
    sinon.stub(launcher, 'detect').resolves(exampleBrowsers)
    await info()
  })
})
