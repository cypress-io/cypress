import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures, { projectPath } from '../lib/fixtures'
import { promises as fs } from 'fs'

const snapshotFile = (project, file, folder = 'e2e') => {
  const filePath = path.join(projectPath(project), 'cypress', folder, file)

  return fs.readFile(filePath).then((content) => {
    systemTests.snapshot(`${project} ${file}`, content.toString())
  })
}

// NOTE: all output snapshots will display the root spec suite twice
// this is intentional and indicates how the studio "restarts" the runner

// TODO: fix these after system tests PR
// @see https://github.com/cypress-io/cypress/issues/18498
describe.skip('e2e studio', function () {
  systemTests.setup()

  systemTests.it('extends test', {
    project: 'studio',
    spec: 'extend.spec.js',
    snapshot: true,
    browser: 'electron',
    onRun (exec) {
      return exec().then(() => snapshotFile('studio', 'extend.spec.js'))
    },
  })

  // includes "New Test" in snapshot
  // this is the blank new test that's being created
  systemTests.it('creates new test', {
    project: 'studio',
    spec: 'new.spec.js',
    browser: 'electron',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('studio', 'new.spec.js'))
    },
  })

  systemTests.it('can write to imported files', {
    project: 'studio',
    spec: 'external.spec.js',
    snapshot: true,
    browser: 'electron',
    onRun (exec) {
      return exec()
      // we snapshot the original spec to make sure it does NOT get written there
      .then(() => snapshotFile('studio', 'external.spec.js'))
      .then(() => snapshotFile('studio', 'external.js', 'support'))
    },
  })

  systemTests.it('extends test without source maps', {
    project: 'studio-no-source-maps',
    spec: 'extend.spec.js',
    snapshot: true,
    browser: 'electron',
    onRun: async (exec) => {
      await Fixtures.scaffoldProject('studio')

      return exec().then(() => snapshotFile('studio-no-source-maps', 'extend.spec.js'))
    },
  })

  systemTests.it('creates new test without source maps', {
    project: 'studio-no-source-maps',
    spec: 'new.spec.js',
    browser: 'electron',
    snapshot: true,
    onRun: async (exec) => {
      await Fixtures.scaffoldProject('studio')

      return exec().then(() => snapshotFile('studio-no-source-maps', 'new.spec.js'))
    },
  })
})
