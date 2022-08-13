// This test uses the ../../../example-express, installing a snapshot and
// checking the metadata for deferreds and healthy modules.
import path from 'path'
import rimraf from 'rimraf'
import { exec as execOrig } from 'child_process'
import { promisify } from 'util'
import { assert } from 'chai'
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import snapshot from 'snap-shot-it'

const exec = promisify(execOrig)
const rmrf = promisify(rimraf)

const EXPRESS_MINIMAL_PROJECT = 'v8-snapshot/example-express'

describe('integration: express', () => {
  it('installs snapshot for example-express', async () => {
    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(EXPRESS_MINIMAL_PROJECT)

    await FixturesScaffold.scaffoldProjectNodeModules(EXPRESS_MINIMAL_PROJECT, false, true)

    const cacheDir = path.join(projectBaseDir, 'cache')
    const metadataFile = path.join(cacheDir, 'snapshot-meta.json')

    try {
      await rmrf(cacheDir)
    } catch (err: any) {
      assert.fail(err.toString())
    }

    const _MB = 1024 * 1024
    const cmd = `node ./snapshot/install-snapshot.js`

    try {
      await exec(cmd, { cwd: projectBaseDir, maxBuffer: 600 * _MB })

      const metadata = require(metadataFile)

      snapshot(metadata)
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)
})
