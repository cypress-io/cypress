import path from 'path'
import snapshot from 'snap-shot-it'

import { root } from '../spec_helper'
import e2e from '../support/helpers/e2e'
import { projectPath } from '../support/helpers/fixtures'

const { fs } = require(`${root}/lib/util/fs`)

const snapshotFile = (project, file, folder = 'integration') => {
  const filePath = path.join(projectPath(project), 'cypress', folder, file)

  return fs.readFile(filePath).then((content) => {
    snapshot(`${project} ${file}`, content.toString())
  })
}

// NOTE: all output snapshots will display the root spec suite twice
// this is intentional and indicates how the studio "restarts" the runner

describe('e2e studio', function () {
  e2e.setup()

  e2e.it('extends test', {
    project: projectPath('studio'),
    spec: 'extend.spec.js',
    snapshot: true,
    browser: 'electron',
    onRun (exec) {
      return exec().then(() => snapshotFile('studio', 'extend.spec.js'))
    },
  })

  // includes "New Test" in snapshot
  // this is the blank new test that's being created
  e2e.it('creates new test', {
    project: projectPath('studio'),
    spec: 'new.spec.js',
    browser: 'electron',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('studio', 'new.spec.js'))
    },
  })

  e2e.it('can write to imported files', {
    project: projectPath('studio'),
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

  e2e.it('extends test without source maps', {
    project: projectPath('studio-no-source-maps'),
    spec: 'extend.spec.js',
    snapshot: true,
    browser: 'electron',
    onRun (exec) {
      return exec().then(() => snapshotFile('studio-no-source-maps', 'extend.spec.js'))
    },
  })

  e2e.it('creates new test without source maps', {
    project: projectPath('studio-no-source-maps'),
    spec: 'new.spec.js',
    browser: 'electron',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('studio-no-source-maps', 'new.spec.js'))
    },
  })
})
