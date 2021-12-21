require('../spec_helper')

const plugins = require('../../lib/plugins')
const Fixtures = require('@tooling/system-tests/lib/fixtures')
const { getCtx } = require('../../lib/makeDataContext')

let ctx

describe('lib/plugins', () => {
  beforeEach(async () => {
    ctx = getCtx()
    Fixtures.scaffoldProject('plugin-before-browser-launch-deprecation')
    await Fixtures.scaffoldCommonNodeModules()
    ctx.actions.project.setActiveProjectForTestSetup(Fixtures.projectPath('plugin-before-browser-launch-deprecation'))
  })

  afterEach(() => {
    Fixtures.remove()
  })

  it('prints deprecation message if before:browser:launch argument is mutated as array', () => {
    const onWarning = sinon.stub()

    const projectConfig = {
      env: {
        BEFORE_BROWSER_LAUNCH_HANDLER: 'return-array-mutation',
      },
    }

    const options = {
      onWarning,
      testingType: 'e2e',
    }

    return plugins.init(projectConfig, options, ctx)
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
