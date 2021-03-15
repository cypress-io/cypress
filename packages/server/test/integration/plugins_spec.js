require('../spec_helper')

const plugins = require('../../lib/plugins')
const Fixtures = require('../support/helpers/fixtures')

const pluginsFile = Fixtures.projectPath('plugin-before-browser-launch-deprecation/cypress/plugins/index.js')

describe('lib/plugins', () => {
  beforeEach(() => {
    Fixtures.scaffold()
  })

  afterEach(() => {
    Fixtures.remove()
  })

  it('prints deprecation message if before:browser:launch argument is mutated as array', () => {
    const onWarning = sinon.stub()

    const projectConfig = {
      pluginsFile,
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-array-mutation',
      },
    }

    const options = {
      onWarning,
    }

    return plugins.init(projectConfig, options)
    .then(() => {
      return plugins.execute('before:browser:launch', {}, {
        args: [],
      })
    })
    .then(() => {
      expect(onWarning).to.be.calledOnce
      expect(onWarning.firstCall.args[0].message).to.include('Deprecation Warning: The `before:browser:launch` plugin event changed its signature in version `4.0.0`')
    })
  })
})
