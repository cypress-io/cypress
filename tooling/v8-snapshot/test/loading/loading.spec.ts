import path from 'path'
import spok from 'spok'
import { SnapshotGenerator } from '../../src/snapshot-generator'
import { exec as execOrig } from 'child_process'
import { promisify } from 'util'
import { electronExecutable } from '../utils/consts'
import { expect, assert } from 'chai'
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import rimraf from 'rimraf'

const exec = promisify(execOrig)
const rmrf = promisify(rimraf)
const t = spok.adapters.chaiExpect(expect)

describe('loading', () => {
  it('loads a healthy module requires a deferred one', async () => {
    const projectName = 'v8-snapshot/deferred-from-healthy'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false, true)
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      spok(t, res, { healthyCodeLen: spok.ge(100) })
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads an entry esm module importing a lodash function', async () => {
    const projectName = 'v8-snapshot/esm'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.mjs')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
    `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
    ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      spok(t, res, { isObjectLike: true })
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads a healthy module that requires an external one', async () => {
    const projectName = 'v8-snapshot/external-from-healthy'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
    `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
    ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })

      const res = JSON.parse(stdout.trim())

      expect(res.healthyString).to.equal('FAKE BLUEBIRD')
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads an app loading and using fsevents which has native module component', async () => {
    const projectName = 'v8-snapshot/native-modules'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      spok(t, res, { itemIsDir: 131072 })
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads a cached module that modifies require cache', async () => {
    const projectName = 'v8-snapshot/require-cache'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await rmrf(cacheDir)

    const snapshotEntryFile = path.join(projectBaseDir, 'cached-manipulator.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/cached-app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const { sync1, sync2, rand1, rand2 } = JSON.parse(stdout.trim())

      expect(sync1).to.not.equal(sync2)
      expect(rand1).to.not.equal(rand2)
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads an uncached module that modifies require cache', async () => {
    const projectName = 'v8-snapshot/require-cache'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await rmrf(cacheDir)

    const snapshotEntryFile = path.join(projectBaseDir, 'uncached-entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/uncached-app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const { sync1, sync2, rand1, rand2 } = JSON.parse(stdout.trim())

      expect(sync1).to.not.equal(sync2)
      expect(rand1).to.not.equal(rand2)
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads from full path provided via variable', async () => {
    const projectName = 'v8-snapshot/require-full-path-var'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      expect(res.version).to.equal('1.1.1')
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)

  it('loads all cached ', async () => {
    const projectName = 'v8-snapshot/stealthy-require'

    Fixtures.remove()
    await FixturesScaffold.scaffoldCommonNodeModules()
    const projectBaseDir = await Fixtures.scaffoldProject(projectName)

    await FixturesScaffold.scaffoldProjectNodeModules(projectName, false)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await rmrf(cacheDir)
    const snapshotEntryFile = path.join(projectBaseDir, 'entry-all-cached.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/spec/non-native.js`

    try {
      const { stdout } = await exec(cmd, { env })

      const lines = stdout.split('\n')

      if (lines[lines.length - 2] !== '# PASS') {
        assert.fail('stdout had #FAIL')
      }
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(20000)
})
