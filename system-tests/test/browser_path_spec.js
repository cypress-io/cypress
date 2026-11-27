const path = require('path')
const { exec } = require('child_process')

const systemTests = require('../lib/system-tests').default
const launcher = require('@packages/launcher')

const absPath = (pathStr) => {
  return new Promise((resolve, reject) => {
    if (path.basename(pathStr) !== pathStr) {
      return resolve(pathStr)
    }

    return exec(`which ${pathStr}`, (err, stdout) => {
      if (err) {
        return reject(err)
      }

      return resolve(stdout.trim())
    })
  })
}

describe('e2e launching browsers by path', () => {
  systemTests.setup()

  it('fails with bad browser path', function () {
    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'simple.cy.js',
      browserPath: '/this/aint/gonna/be/found',
      expectedExitCode: 1,
    })
    .then((res) => {
      expect(res.stdout).to.contain('We could not identify a known browser at the path you provided: /this/aint/gonna/be/found')

      expect(res.code).to.eq(1)
    })
  })

  it('works with an installed browser path', async function () {
    const browserName = process.env.BROWSER || 'chrome'

    // NOTE: Electron ships inside Cypress and WebKit comes from playwright-webkit, so neither has an installed path
    if (browserName === 'electron' || browserName === 'webkit') {
      return this.skip()
    }

    // Beta, Dev and Canary share the name, but the snapshot only normalizes the stable display name
    const browser = (await launcher.detect()).find(({ name, channel }) => name === browserName && channel === 'stable')

    if (!browser) {
      throw new Error(`${browserName} must be installed for this test`)
    }

    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'simple.cy.js',
      browser: browserName,
      // turn binary browser names ("google-chrome") into their absolute paths
      // so that server recognizes them as a path, not as a browser name
      browserPath: await absPath(browser.path),
      snapshot: true,
    })
  })
})
