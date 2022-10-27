import path from 'path'
import { SnapshotGenerator } from '../../src/generator/snapshot-generator'
import { exec as execOrig } from 'child_process'
import { promisify } from 'util'
import { electronExecutable } from '../utils/consts'
import { expect, assert } from 'chai'
import Fixtures from '@tooling/system-tests'
import * as FixturesScaffold from '@tooling/system-tests/lib/dep-installer'
import fs from 'fs-extra'

const exec = promisify(execOrig)

const scaffoldProject = async (project: string): Promise<string> => {
  Fixtures.remove()
  await FixturesScaffold.scaffoldCommonNodeModules()
  await FixturesScaffold.symlinkNodeModule('electron')
  await FixturesScaffold.symlinkNodeModule('@packages/v8-snapshot-require')
  const projectBaseDir = await Fixtures.scaffoldProject(project)

  await FixturesScaffold.scaffoldProjectNodeModules({ project, updateLockFile: false, forceCopyDependencies: true })

  return projectBaseDir
}

describe('loading', () => {
  it('loads a healthy module requires a deferred one', async () => {
    const projectName = 'v8-snapshot/deferred-from-healthy'

    const projectBaseDir = await scaffoldProject(projectName)
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
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      expect(res.healthyCodeLen).to.be.gte(100)
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })

  it('loads an entry esm module importing a lodash function', async () => {
    const projectName = 'v8-snapshot/esm'

    const projectBaseDir = await scaffoldProject(projectName)
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
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
    `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
    ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })
      const res = JSON.parse(stdout.trim())

      expect(res.isObjectLike).to.be.true
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })

  it('loads a healthy module that requires an external one', async () => {
    const projectName = 'v8-snapshot/external-from-healthy'

    const projectBaseDir = await scaffoldProject(projectName)

    await fs.move(path.join(projectBaseDir, 'bluebird'), path.join(projectBaseDir, 'node_modules', 'bluebird'))
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
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
    `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
    ` ${projectBaseDir}/app.js`

    try {
      const { stdout } = await exec(cmd, { env })

      const res = JSON.parse(stdout.trim())

      expect(res.healthyString).to.be.equal('FAKE BLUEBIRD')
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })

  if (process.platform === 'darwin') {
    it('loads an app loading and using fsevents which has native module component', async () => {
      const projectName = 'v8-snapshot/native-modules'

      const projectBaseDir = await scaffoldProject(projectName)
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
        DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
        PROJECT_BASE_DIR: projectBaseDir,
        DEBUG_COLORS: 1,
      }
      const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

      try {
        const { stdout } = await exec(cmd, { env })
        const res = JSON.parse(stdout.trim())

        expect(res.itemIsDir).to.be.equal(131072)
      } catch (err: any) {
        assert.fail(err.toString())
      }
    })
  }

  it('loads a cached module that modifies require cache', async () => {
    const projectName = 'v8-snapshot/require-cache'

    const projectBaseDir = await scaffoldProject(projectName)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await fs.remove(cacheDir)

    const snapshotEntryFile = path.join(projectBaseDir, 'cached-manipulator.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
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
  })

  it('loads an uncached module that modifies require cache', async () => {
    const projectName = 'v8-snapshot/require-cache'

    const projectBaseDir = await scaffoldProject(projectName)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await fs.remove(cacheDir)

    const snapshotEntryFile = path.join(projectBaseDir, 'uncached-entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
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
  })

  it('loads from full path provided via variable', async () => {
    const projectName = 'v8-snapshot/require-full-path-var'

    const projectBaseDir = await scaffoldProject(projectName)
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
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
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
  })

  it('loads all cached', async () => {
    const projectName = 'v8-snapshot/stealthy-require'

    const projectBaseDir = await scaffoldProject(projectName)
    const cacheDir = path.join(projectBaseDir, 'cache')

    await fs.remove(cacheDir)
    const snapshotEntryFile = path.join(projectBaseDir, 'entry-all-cached.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/spec/non-native.js`

    try {
      const { stdout, stderr } = await exec(cmd, { env })

      const lines = stdout.split('\n')

      if (lines[lines.length - 2] !== '# PASS') {
        assert.fail(`stdout had #FAIL:\n${stdout}\n${stderr}`)
      }
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })
})
