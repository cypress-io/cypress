require('../spec_helper')

import * as linuxHelper from '../../lib/linux'
import 'chai-as-promised'
import { log } from '../log'
import { detect } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'
import { expect } from 'chai'
import execa from 'execa'
import sinon, { SinonStub } from 'sinon'

describe('linux browser detection', () => {
  let stdout: SinonStub

  beforeEach(() => {
    stdout = sinon.stub(execa, 'stdout')

    stdout.withArgs('test-browser', ['--version'])
    .resolves('test-browser v100.1.2.3')

    stdout.withArgs('foo-browser', ['--version'])
    .resolves('foo-browser v100.1.2.3')

    stdout.withArgs('foo-bar-browser', ['--version'])
    .resolves('foo-browser v100.1.2.3')

    stdout.withArgs('/foo/bar/browser', ['--version'])
    .resolves('foo-browser v9001.1.2.3')
  })

  it('detects browser by running --version', () => {
    const goal = goalBrowsers[0]
    const checkBrowser = (browser) => {
      expect(browser).to.deep.equal({
        name: 'test-browser-name',
        path: 'test-browser',
        version: '100.1.2.3',
      })
    }

    // @ts-ignore
    return linuxHelper.detect(goal).then(checkBrowser)
  })

  // despite using detect(), this test is in linux/spec instead of detect_spec because it is
  // testing side effects that occur within the Linux-specific detect function
  // https://github.com/cypress-io/cypress/issues/1400
  it('properly eliminates duplicates', () => {
    const expected = [
      {
        displayName: 'Test Browser',
        name: 'test-browser-name',
        version: '100.1.2.3',
        path: 'test-browser',
        majorVersion: 100,
      },
      {
        displayName: 'Foo Browser',
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: 100,
      },
    ]

    // @ts-ignore
    return detect(goalBrowsers).then((browsers) => {
      log('Browsers: %o', browsers)
      log('Expected browsers: %o', expected)
      expect(browsers).to.deep.equal(expected)
    })
  })

  it('considers multiple binary names', () => {
    const goalBrowsers = [
      {
        name: 'foo-browser',
        versionRegex: /v(\S+)$/,
        profile: true,
        binary: ['foo-browser', 'foo-bar-browser'],
      },
    ]

    const expected = [
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: 100,
      },
    ]

    // @ts-ignore
    return detect(goalBrowsers).then((browsers) => {
      log('Browsers: %o', browsers)
      log('Expected browsers: %o', expected)
      expect(browsers).to.deep.equal(expected)
    })
  })

  context('#getVersionString', () => {
    it('runs the command with `--version` and returns trimmed output', async () => {
      stdout.withArgs('foo', ['--version']).resolves('  bar  ')

      expect(await linuxHelper.getVersionString('foo')).to.eq('bar')
    })

    it('rejects with errors', async () => {
      const err = new Error()

      stdout.withArgs('foo', ['--version']).rejects(err)

      await expect(linuxHelper.getVersionString('foo')).to.be.rejectedWith(err)
    })
  })
})
