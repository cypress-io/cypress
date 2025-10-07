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

  it('fails with bad browser path', async function () {
    try {
      await systemTests.exec(this, {
        project: 'e2e',
        spec: 'simple.cy.js',
        browser: '/this/aint/gonna/be/found',
        expectedExitCode: 1,
      })
    } catch (err) {
      expect(err.message).to.contain('We could not identify a known browser at the path you provided: `/this/aint/gonna/be/found`')

      expect(err.code).to.eq(1)
    }
  })

  it('works with an installed browser path', async function () {
    const browsers = await launcher.detect()
    const browser = browsers.find((browser) => browser.family === 'chromium')

    if (!browser) {
      throw new Error('A \'chromium\' family browser must be installed for this test')
    }

    const absolutePath = await absPath(browser.path)

    return systemTests.exec(this, {
      project: 'e2e',
      spec: 'simple.cy.js',
      browser: absolutePath,
      snapshot: true,
      video: false,
    })
  })
})
