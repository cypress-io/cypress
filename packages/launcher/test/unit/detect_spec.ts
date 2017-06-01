const detect = require('../../lib/detect').default
const log = require('debug')('cypress:launcher:test')
import {project} from 'ramda'

describe('browser detection', () => {
  // making simple to debug tests
  // using DEBUG=... flag
  const checkBrowsers = browsers => {
    log('detected browsers %j', browsers)
    expect(browsers).to.be.an.array

    const mainProps = project(['name', 'version'], browsers)
    log('%d browsers\n%j', browsers.length, mainProps)
    expect(browsers.length).to.be.gt(0)
  }

  // we are only going to run tests on platforms with at least
  // one browser. This test, is really E2E because it finds
  // real browsers
  it('detects available browsers', () => {
    return detect().then(checkBrowsers)
  })
})
