const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')
const snapshot = require('snap-shot-it')
const path = require('path')

describe('e2e component tests', () => {
  e2e.setup()

  const project = Fixtures.projectPath('component-tests')

  it('runs just the integration spec file', function () {
    return e2e.exec(this, {
      project,
      spec: 'integration-spec.js',
      config: {
        video: false,
      },
    })
    .then((result) => {
      const runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))

      return snapshot('integration spec run', runSummary)
    })
  })

  it('runs component spec file', function () {
    // for now the component spec should use full path
    const spec = path.join(project, 'cypress/component-tests/foo.spec.js')

    return e2e.exec(this, {
      project,
      spec,
      config: {
        video: false,
      },
    })
    .then((result) => {
      const runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))

      return console.log(runSummary)
    })
  })

  it('runs integration and component spec file when running all tests', function () {
    return e2e.exec(this, {
      project,
      config: {
        video: false,
      },
    })
    .then((result) => {
      const runSummary = e2e.leaveRunFinishedTable(e2e.normalizeStdout(result.stdout))

      return snapshot('all tests results summary', runSummary)
    })
  })
})
