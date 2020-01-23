require('../spec_helper')
import { expect } from 'chai'
import { detect, setMajorVersion } from '../../lib/detect'
const os = require('os')
import { log } from '../log'
import { project } from 'ramda'
import { FoundBrowser } from '../../lib/types'

const isWindows = () => {
  return os.platform() === 'win32'
}

describe('browser detection', () => {
  // making simple to debug tests
  // using DEBUG=... flag
  const checkBrowsers = (browsers) => {
    log('detected browsers %j', browsers)
    expect(browsers).to.be.an('array')

    const mainProps = project(['name', 'version'], browsers)

    log('%d browsers\n%j', browsers.length, mainProps)

    if (isWindows()) {
      // we might not find any browsers on Windows CI
      expect(browsers.length).to.be.gte(0)
    } else {
      expect(browsers.length).to.be.gt(0)
    }
  }

  // we are only going to run tests on platforms with at least
  // one browser. This test, is really E2E because it finds
  // real browsers
  it('detects available browsers', () => {
    return detect().then(checkBrowsers)
  })

  context('setMajorVersion', () => {
    const foundBrowser: FoundBrowser = {
      name: 'test browser',
      path: 'a path',
      version: '11.22.33',
      family: 'chrome',
      /** Optional display name */
      displayName: '',
      /** RegExp to use to extract version from something like "Google Chrome 58.0.3029.110" */
      versionRegex: new RegExp(''),
      profile: false,
      /** A single binary name or array of binary names for this browser. Not used on Windows. */
      binary: '',
    }

    setMajorVersion(foundBrowser)
    expect(foundBrowser.majorVersion, 'major version was converted to number').to.equal(11)
  })
})
