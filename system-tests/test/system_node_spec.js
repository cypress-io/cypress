const systemTests = require('../lib/system-tests').default
const execa = require('execa')

let expectedNodeVersion
let expectedNodePath

describe('e2e system node', () => {
  before(async () => {
    // Grab the system node version and path before running the tests.
    expectedNodeVersion = (await execa('node', ['-v'])).stdout.slice(1)
    expectedNodePath = (await execa('node', ['-e', 'console.log(process.execPath)'])).stdout
  })

  systemTests.setup()

  it('uses system node when launching plugins file', async function () {
    const { stderr } = await systemTests.exec(this, {
      project: 'system-node',
      userNodePath: expectedNodePath,
      userNodeVersion: expectedNodeVersion,
      config: {
        videoCompression: false,
        nodeVersion: 'system',
        env: {
          expectedNodeVersion,
          expectedNodePath,
        },
      },
      spec: 'system.spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })

    expect(stderr).to.contain(`Plugin Node version: ${expectedNodeVersion}`)

    expect(stderr).to.contain('Plugin Electron version: undefined')
  })

  it('uses bundled node when launching plugins file', async function () {
    const { stderr } = await systemTests.exec(this, {
      project: 'system-node',
      config: {
        videoCompression: false,
        nodeVersion: 'bundled',
        env: {
          expectedNodeVersion,
        },
      },
      spec: 'bundled.spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })

    expect(stderr).to.contain(`Plugin Node version: ${expectedNodeVersion}`)

    expect(stderr).to.not.contain('Plugin Electron version: undefined')
  })

  it('uses default node when launching plugins file', async function () {
    const { stderr } = await systemTests.exec(this, {
      project: 'system-node',
      userNodePath: expectedNodePath,
      userNodeVersion: expectedNodeVersion,
      config: {
        videoCompression: false,
        env: {
          expectedNodeVersion,
          expectedNodePath,
        },
      },
      spec: 'default.spec.js',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })

    expect(stderr).to.contain(`Plugin Node version: ${expectedNodeVersion}`)

    expect(stderr).to.contain('Plugin Electron version: undefined')
  })
})
