const path = require('path')

const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')

const e2eProject = Fixtures.projectPath('e2e')

describe('e2e plugins', function () {
  e2e.setup()

  // this tests verifies stdout manually instead of via snapshot because
  // there's a degree of randomness as to whether the error occurs before or
  // after the run output starts. the important thing is that the run is
  // failed and the right error is displayed
  e2e.it('fails when there is an async error at the root', {
    browser: 'chrome',
    spec: 'app_spec.js',
    project: Fixtures.projectPath('plugins-root-async-error'),
    expectedExitCode: 1,
    onRun (exec) {
      return exec().then(({ stdout }) => {
        expect(stdout).to.include('The following error was thrown by a plugin. We stopped running your tests because a plugin crashed. Please check your plugins file')
        expect(stdout).to.include('Error: Root async error from plugins file')
      })
    },
  })

  it('fails when there is an async error inside an event handler', function () {
    return e2e.exec(this, {
      spec: 'app_spec.js',
      project: Fixtures.projectPath('plugins-async-error'),
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('can modify config from plugins', function () {
    return e2e.exec(this, {
      spec: 'app_spec.js',
      env: 'foo=foo,bar=bar',
      config: { pageLoadTimeout: 10000 },
      project: Fixtures.projectPath('plugin-config'),
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  it('passes version correctly', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('plugin-config-version'),
    })
  })

  it('catches invalid viewportWidth returned from plugins', function () {
    // the test project returns config object with a bad value
    return e2e.exec(this, {
      project: Fixtures.projectPath('plugin-returns-bad-config'),
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browsers list returned from plugins', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('plugin-returns-empty-browsers-list'),
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('catches invalid browser returned from plugins', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('plugin-returns-invalid-browser'),
      expectedExitCode: 1,
      snapshot: true,
    })
  })

  it('can filter browsers from config', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('plugin-filter-browsers'),
      // the test project filters available browsers
      // and returns a list with JUST Electron browser
      // and we ask to run in Chrome
      // thus the test should fail
      browser: 'chrome',
      expectedExitCode: 1,
      snapshot: true,
      // we are interested in the actual filtered available browser name
      // which should be "electron"
      normalizeStdoutAvailableBrowsers: false,
    })
  })

  e2e.it('works with user extensions', {
    browser: 'chrome',
    spec: 'app_spec.js',
    headed: true,
    project: Fixtures.projectPath('plugin-extension'),
    sanitizeScreenshotDimensions: true,
    snapshot: true,
  })

  it('handles absolute path to pluginsFile', function () {
    const pluginsAbsolutePath = Fixtures.projectPath('plugins-absolute-path')

    return e2e.exec(this, {
      spec: 'absolute_spec.js',
      config: {
        pluginsFile: path.join(
          pluginsAbsolutePath,
          'cypress/plugins/index.js',
        ),
      },
      project: pluginsAbsolutePath,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
    })
  })

  const pluginAfterScreenshot = Fixtures.projectPath('plugin-after-screenshot')

  it('calls after:screenshot for cy.screenshot() and failure screenshots', function () {
    return e2e.exec(this, {
      spec: 'after_screenshot_spec.js',
      project: pluginAfterScreenshot,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  // https://github.com/cypress-io/cypress/issues/8079
  it('does not report more screenshots than exist if user overwrites previous screenshot in afterScreenshot', function () {
    return e2e.exec(this, {
      spec: 'after_screenshot_overwrite_spec.js',
      project: pluginAfterScreenshot,
      snapshot: true,
    })
  })

  it('fails when invalid event is registered', function () {
    return e2e.exec(this, {
      spec: 'app_spec.js',
      project: Fixtures.projectPath('plugin-validation-error'),
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  it('fails when there is no function exported', function () {
    return e2e.exec(this, {
      spec: 'app_spec.js',
      project: Fixtures.projectPath('plugin-empty'),
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })

  describe('preprocessor', function () {
    it('passes with working preprocessor', function () {
      return e2e.exec(this, {
        spec: 'app_spec.js',
        project: Fixtures.projectPath('working-preprocessor'),
        sanitizeScreenshotDimensions: true,
        snapshot: true,
      })
    })

    it('supports node builtins', function () {
      return e2e.exec(this, {
        spec: 'node_builtins_spec.js',
      })
    })

    // https://github.com/cypress-io/cypress/issues/8361
    it('supports .mjs files', function () {
      return e2e.exec(this, {
        spec: 'mjs_spec.mjs',
      })
    })
  })

  describe('projectRoot and configFile', function () {
    it('passes projectRoot and default configFile to plugins function', function () {
      return e2e.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress.json'),
          },
        },
      })
    })

    it('passes custom configFile to plugins function', function () {
      return e2e.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        configFile: 'cypress-alt.json',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: path.join(e2eProject, 'cypress-alt.json'),
          },
        },
      })
    })

    it('passes false configFile to plugins function', function () {
      return e2e.exec(this, {
        spec: 'plugins_config_extras_spec.js',
        configFile: 'false',
        config: {
          env: {
            projectRoot: e2eProject,
            configFile: false,
          },
        },
      })
    })
  })
})
