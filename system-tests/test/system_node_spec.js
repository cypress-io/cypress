const systemTests = require('../lib/system-tests').default
const execa = require('execa')
const Fixtures = require('../lib/fixtures')
const Promise = require('bluebird')

const systemNode = Fixtures.projectPath('system-node')

describe('e2e system node', () => {
  systemTests.setup()

  it('uses system node when launching plugins file', function () {
    return Promise.join(
      execa.stdout('node', ['-v']),
      execa.stdout('node', ['-e', 'console.log(process.execPath)']),
      (expectedNodeVersion, expectedNodePath) => {
        expectedNodeVersion = expectedNodeVersion.slice(1) // v1.2.3 -> 1.2.3

        return systemTests.exec(this, {
          project: systemNode,
          config: {
            env: {
              expectedNodeVersion,
              expectedNodePath,
            },
          },
          spec: 'spec.js',
          sanitizeScreenshotDimensions: true,
          snapshot: true,
        })
        .then(({ stderr }) => {
          expect(stderr).to.contain(`Plugin Node version: ${expectedNodeVersion}`)

          expect(stderr).to.contain('Plugin Electron version: undefined')
        })
      },
    )
  })
})
