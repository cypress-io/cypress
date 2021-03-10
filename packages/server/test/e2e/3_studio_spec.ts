import path from 'path'
import snapshot from 'snap-shot-it'

import { root } from '../spec_helper'
import e2e from '../support/helpers/e2e'
import { projectPath } from '../support/helpers/fixtures'

const { fs } = require(`${root}/lib/util/fs`)

const project = projectPath('studio')

const snapshotFile = (file, folder = 'integration') => {
  const filePath = path.join(project, 'cypress', folder, file)

  return fs.readFile(filePath).then((content) => {
    snapshot(file, content.toString())
  })
}

// NOTE: all output snapshots will display the root spec suite twice
// this is intentional and indicates how the studio "restarts" the runner

describe('e2e studio', function () {
  e2e.setup()

  e2e.it('extends test', {
    project,
    spec: 'extend.spec.js',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('extend.spec.js'))
    },
  })

  // includes "New Test" in snapshot
  // this is the blank new test that's being created
  e2e.it('creates new test', {
    project,
    spec: 'new.spec.js',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('new.spec.js'))
    },
  })

  e2e.it('can write to imported files', {
    project,
    spec: 'external.spec.js',
    snapshot: true,
    onRun (exec) {
      return exec()
      // we snapshot the original spec to make sure it does NOT get written there
      .then(() => snapshotFile('external.spec.js'))
      .then(() => snapshotFile('external.js', 'support'))
    },
  })

  e2e.it('can create tests in empty spec files', {
    project,
    spec: 'empty.spec.js',
    snapshot: true,
    onRun (exec) {
      return exec().then(() => snapshotFile('empty.spec.js'))
    },
  })
})
