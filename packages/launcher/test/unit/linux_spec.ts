require('../spec_helper')

import _ from 'lodash'
import * as linuxHelper from '../../lib/linux'
import 'chai-as-promised'
import { log } from '../log'
import { detect } from '../../lib/detect'
import { goalBrowsers } from '../fixtures'
import { expect } from 'chai'
import { utils } from '../../lib/utils'
import os from 'os'
import sinon, { SinonStub } from 'sinon'
import mockFs from 'mock-fs'

describe('linux browser detection', () => {
  let execa: SinonStub
  let cachedEnv = { ...process.env }

  beforeEach(() => {
    execa = sinon.stub(utils, 'getOutput')

    sinon.stub(os, 'platform').returns('linux')
    sinon.stub(os, 'release').returns('1.0.0')

    execa.withArgs('test-browser', ['--version'])
    .resolves({ stdout: 'test-browser v100.1.2.3' })

    execa.withArgs('foo-browser', ['--version'])
    .resolves({ stdout: 'foo-browser v100.1.2.3' })

    execa.withArgs('foo-bar-browser', ['--version'])
    .resolves({ stdout: 'foo-browser v100.1.2.3' })

    execa.withArgs('/foo/bar/browser', ['--version'])
    .resolves({ stdout: 'foo-browser v9001.1.2.3' })
  })

  afterEach(() => {
    Object.assign(process.env, cachedEnv)
    mockFs.restore()
    sinon.restore()
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

  // https://github.com/cypress-io/cypress/pull/7039
  it('sets profilePath on snapcraft chromium', () => {
    execa.withArgs('chromium', ['--version'])
    .resolves({ stdout: 'Chromium 64.2.3 snap' })

    sinon.stub(os, 'homedir').returns('/home/foo')

    const checkBrowser = ([browser]) => {
      expect(browser).to.deep.equal({
        channel: 'stable',
        name: 'chromium',
        family: 'chromium',
        displayName: 'Chromium',
        majorVersion: '64',
        path: 'chromium',
        profilePath: '/home/foo/snap/chromium/current',
        version: '64.2.3',
      })
    }

    return detect().then(checkBrowser)
  })

  // https://github.com/cypress-io/cypress/issues/19793
  context('sets profilePath on snapcraft firefox', () => {
    const expectedSnapFirefox = {
      channel: 'stable',
      name: 'firefox',
      family: 'firefox',
      displayName: 'Firefox',
      majorVersion: '99',
      path: 'firefox',
      profilePath: '/home/foo/snap/firefox/current',
      version: '99.2.3',
    }

    beforeEach(() => {
      execa.withArgs('firefox', ['--version'])
      .resolves({ stdout: 'Mozilla Firefox 99.2.3' })

      sinon.stub(os, 'homedir').returns('/home/foo')
    })

    it('with shim script', async () => {
      process.env.PATH = '/bin'
      mockFs({
        '/bin/firefox': mockFs.symlink({ path: '/usr/bin/firefox' }),
        '/usr/bin/firefox': mockFs.file({ mode: 0o777, content: 'foo bar foo bar foo bar\nexec /snap/bin/firefox\n' }),
      })

      const [browser] = await detect()

      expect(browser).to.deep.equal(expectedSnapFirefox)
    })

    it('with /snap/bin in path', async () => {
      process.env.PATH = '/bin:/snap/bin'
      mockFs({
        '/snap/bin/firefox': mockFs.file({ mode: 0o777, content: 'binary' }),
      })

      const [browser] = await detect()

      expect(browser).to.deep.equal(expectedSnapFirefox)
    })

    it('with symlink to /snap/bin in path', async () => {
      process.env.PATH = '/bin'
      mockFs({
        '/bin/firefox': mockFs.symlink({ path: '/snap/bin/firefox' }),
        '/snap/bin/firefox': mockFs.file({ mode: 0o777, content: 'binary' }),
      })

      const [browser] = await detect()

      expect(browser).to.deep.equal(expectedSnapFirefox)
    })
  })

  // https://github.com/cypress-io/cypress/issues/6669
  it('detects browser if the --version stdout is multiline', () => {
    execa.withArgs('multiline-foo', ['--version'])
    .resolves({
      stdout: `
        Running without a11y support!
        foo-browser v9001.1.2.3
      `,
    })

    const goal = _.defaults({ binary: 'multiline-foo' }, _.find(goalBrowsers, { name: 'foo-browser' }))
    const checkBrowser = (browser) => {
      expect(browser).to.deep.equal({
        name: 'foo-browser',
        path: 'multiline-foo',
        version: '9001.1.2.3',
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
        majorVersion: '100',
      },
      {
        displayName: 'Foo Browser',
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
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
        binary: ['foo-browser', 'foo-bar-browser'],
      },
    ]

    const expected = [
      {
        name: 'foo-browser',
        version: '100.1.2.3',
        path: 'foo-browser',
        majorVersion: '100',
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
      execa.withArgs('foo', ['--version']).resolves({ stdout: '  bar  ' })

      expect(await linuxHelper.getVersionString('foo')).to.eq('bar')
    })

    it('rejects with errors', async () => {
      const err = new Error()

      execa.withArgs('foo', ['--version']).rejects(err)

      await expect(linuxHelper.getVersionString('foo')).to.be.rejectedWith(err)
    })
  })
})
