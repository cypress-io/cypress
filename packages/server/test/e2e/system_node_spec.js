const e2e = require('../support/helpers/e2e').default
const execa = require('execa')
const Fixtures = require('../support/helpers/fixtures')
const Promise = require('bluebird')

const systemNode = Fixtures.projectPath('system-node')

describe('e2e system node', () => {
  e2e.setup()

  it('uses system node when launching plugins file', function () {
    return Promise.join(
      execa.stdout('node', ['-v']),
      execa.stdout('node', ['-e', 'console.log(process.execPath)']),
      (expectedNodeVersion, expectedNodePath) => {
        expectedNodeVersion = expectedNodeVersion.slice(1) // v1.2.3 -> 1.2.3

        return e2e.exec(this, {
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
