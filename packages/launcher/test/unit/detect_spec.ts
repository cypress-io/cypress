require('../spec_helper')
import _ from 'lodash'
import { detect, detectByPath, getMajorVersion } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'
import { expect } from 'chai'
import { utils } from '../../lib/utils'
import sinon, { SinonStub } from 'sinon'
import os from 'os'
import { log } from '../log'
import * as linuxHelper from '../../lib/linux'
import * as darwinHelper from '../../lib/darwin'
import * as windowsHelper from '../../lib/windows'
import type { Browser } from '@packages/types'

const isWindows = () => {
  return os.platform() === 'win32'
}

const stubHelpers = (detect) => {
  sinon.stub(linuxHelper, 'detect').callsFake(detect)
  sinon.stub(darwinHelper, 'detect').callsFake(detect)
  sinon.stub(windowsHelper, 'detect').callsFake(detect)
}

describe('detect', () => {
  // making simple to debug tests
  // using DEBUG=... flag
  const checkBrowsers = (browsers) => {
    log('detected browsers %j', browsers)
    expect(browsers).to.be.an('array')

    const mainProps = browsers.map((val) => _.pick(val, ['name', 'version']))

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

  describe('#getMajorVersion', () => {
    it('parses major version from provided string', () => {
      expect(getMajorVersion('123.45.67')).to.eq('123')
      expect(getMajorVersion('Browser 77.1.0')).to.eq('Browser 77')
      expect(getMajorVersion('999')).to.eq('999')
    })
  })

  describe('#detect', () => {
    const testBrowser = {
      name: 'test-browser',
      family: 'chromium',
      channel: 'test-channel',
      displayName: 'Test Browser',
      versionRegex: /Test Browser (\S+)/m,
      binary: 'test-browser-beta',
    }

    it('validates browser with own validator property', async () => {
      stubHelpers((browser) => {
        return Promise.resolve({
          name: browser.name,
          path: '/path/to/test-browser',
          version: '130',
        })
      })

      const mockValidator = sinon.stub().returns({ isSupported: true })

      const foundBrowsers = await detect([{ ...testBrowser as Browser, validator: mockValidator }])

      expect(foundBrowsers).to.have.length(1)

      const foundTestBrowser = foundBrowsers[0]

      expect(foundTestBrowser.name).to.eq('test-browser')
      expect(foundTestBrowser.displayName).to.eq('Test Browser')
      expect(foundTestBrowser.majorVersion, 'majorVersion').to.eq('130')
      expect(foundTestBrowser.unsupportedVersion, 'unsupportedVersion').to.be.undefined
      expect(foundTestBrowser.warning, 'warning').to.be.undefined
      expect(mockValidator).to.have.been.called
    })
  })

  describe('#detectByPath', () => {
    let execa: SinonStub

    beforeEach(() => {
      execa = sinon.stub(utils, 'getOutput')

      execa.withArgs('/Applications/My Shiny New Browser.app', ['--version'])
      .resolves({ stdout: 'foo-browser v100.1.2.3' })

      execa.withArgs('/foo/bar/browser', ['--version'])
      .resolves({ stdout: 'foo-browser v9001.1.2.3' })

      execa.withArgs('/not/a/browser', ['--version'])
      .resolves({ stdout: 'not a browser version string' })

      execa.withArgs('/not/a/real/path', ['--version'])
      .rejects()
    })

    it('detects by path', () => {
      // @ts-ignore
      return detectByPath('/foo/bar/browser', goalBrowsers)
      .then((browser) => {
        expect(browser).to.deep.equal(
          Object.assign({}, goalBrowsers.find((gb) => {
            return gb.name === 'foo-browser'
          }), {
            displayName: 'Custom Foo Browser',
            info: 'Loaded from /foo/bar/browser',
            custom: true,
            version: '9001.1.2.3',
            majorVersion: '9001',
            path: '/foo/bar/browser',
          }),
        )
      })
    })

    it('rejects when there was no matching versionRegex', () => {
      // @ts-ignore
      return detectByPath('/not/a/browser', goalBrowsers)
      .then(() => {
        throw Error('Should not find a browser')
      })
      .catch((err) => {
        expect(err.notDetectedAtPath).to.be.true
      })
    })

    it('rejects when there was an error executing the command', () => {
      // @ts-ignore
      return detectByPath('/not/a/real/path', goalBrowsers)
      .then(() => {
        throw Error('Should not find a browser')
      })
      .catch((err) => {
        expect(err.notDetectedAtPath).to.be.true
      })
    })

    it('works with spaces in the path', () => {
      // @ts-ignore
      return detectByPath('/Applications/My Shiny New Browser.app', goalBrowsers)
      .then((browser) => {
        expect(browser).to.deep.equal(
          Object.assign({}, goalBrowsers.find((gb) => {
            return gb.name === 'foo-browser'
          }), {
            displayName: 'Custom Foo Browser',
            info: 'Loaded from /Applications/My Shiny New Browser.app',
            custom: true,
            version: '100.1.2.3',
            majorVersion: '100',
            path: '/Applications/My Shiny New Browser.app',
          }),
        )
      })
    })
  })
})
