import path from 'path'
import { readBundleResult } from '../utils/bundle'
import { SnapshotGenerator } from '../../src/snapshot-generator'
import { Flag } from '../../src/snapshot-generator-flags'
import { electronExecutable } from '../utils/consts'
import { expect, assert } from 'chai'
import rimraf from 'rimraf'
import { promisify } from 'util'
import { exec as execOrig } from 'child_process'

const rmrf = promisify(rimraf)
const exec = promisify(execOrig)

describe('doctor', () => {
  it('snapshots an entry points with two modules, one accessing Buffer', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'access-buffer')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      flags: Flag.Script,
    })

    await generator.createExportBundle()
    const { meta, exported } = readBundleResult(cacheDir)

    expect(meta).to.deep.equal({
      norewrite: [],
      deferred: ['./accessing-buffer.js'],
      deferredHashFile: '<not used>',
      healthy: ['./entry.js', './valid-module.js'],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: ['./valid-module.js', './accessing-buffer.js', './entry.js'],
    })
  })

  it('snapshots entry points modules using and one reassigning console ', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'console-assign')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      flags: Flag.Script,
    })

    await generator.createExportBundle()
    const { meta, exported } = readBundleResult(cacheDir)

    expect(meta).to.deep.equal({
      norewrite: [],
      deferred: [],
      deferredHashFile: '<not used>',
      healthy: ['./entry.js', './reassign-console.js', './using-console.js'],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: ['./reassign-console.js', './using-console.js', './entry.js'],
    })

    const reassign = exported['./reassign-console.js'].toString()

    expect(reassign.includes('typeof get_console()'), 'reassign-console.js: does rewrite typeof console').to.be.true

    expect(reassign.includes('get_console().log'), 'reassign-console.js: does rewrite typeof console.log').to.be.true

    expect(!reassign.includes('get_console() = function') && reassign.includes('console = function'), 'reassign-console.js: does not rewrite console =').to.be.true,

    expect(exported['./using-console.js'].toString().includes('get_console'), 'using-console.js: does rewrite console').to.be.true
  })

  it('snapshots with requiring a module that depends on a module needing to be deferred', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'deep-nested-deferred')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')

    await rmrf(cacheDir)
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: process.env.DEBUG ?? '(packherd|snapgen):*',
      PROJECT_BASE_DIR: projectBaseDir,
      DEBUG_COLORS: 1,
    }
    const cmd =
      `${electronExecutable} -r ${projectBaseDir}/hook-require.js` +
      ` ${projectBaseDir}/app.js`

    let stdout: string | undefined

    try {
      ({ stdout } = await exec(cmd, { env }))
      const res = JSON.parse(stdout.trim())

      expect(res.errname).to.equal('Unknown system error -666')
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(10000)

  it('snapshots using dir/file name delayed and during init ', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'dirname-filename-use')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      flags: Flag.Script,
    })

    await generator.createExportBundle()
    const { meta, exported } = readBundleResult(cacheDir)

    expect(meta).to.deep.equal({
      norewrite: [],
      deferred: ['./using-filename-init.js'],
      deferredHashFile: '<not used>',
      healthy: ['./entry.js', './using-dirname-delayed.js', './valid-module.js'],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: [
        './valid-module.js',
        './using-dirname-delayed.js',
        './using-filename-init.js',
        './entry.js',
      ],
    })
  })

  it('snapshots entry points to modules, with missing functions', async () => {
    const projectBaseDir = path.join(
      __dirname,
      '..',
      'fixtures',
      'invoke-missing-function',
    )
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      flags: Flag.Script,
    })

    await generator.createExportBundle()
    const { meta, exported } = readBundleResult(cacheDir)

    expect(meta).to.deep.equal({
      norewrite: ['./invoke-not-function.js', './invoke-undefined.js'],
      deferred: ['./invoke-push-on-undefined.js'],
      deferredHashFile: '<not used>',
      healthy: ['./entry.js', './valid-module.js'],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: [
        './valid-module.js',
        './invoke-not-function.js',
        './invoke-undefined.js',
        './invoke-push-on-undefined.js',
        './entry.js',
      ],
    })
  })

  it('snapshots entry points to dependents of a module that is statically deferred', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'load-static-deferred')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      includeStrictVerifiers: true,
      flags: Flag.Script,
    })

    await generator.createExportBundle()
    const { meta, exported } = readBundleResult(cacheDir)

    expect(meta).to.deep.equal({
      norewrite: [],
      deferred: [
        './loads-lateuses-static-deferred.js',
        './loads-static-deferred.js',
        './static-deferred.js',
        './uses-loads-static-deferred.js',
      ],
      deferredHashFile: '<not used>',
      healthy: [
        './entry.js',
        './lateuses-static-deferred.js',
        './uses-lateuses-static-deferred.js',
      ],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: [
        './static-deferred.js',
        './loads-static-deferred.js',
        './lateuses-static-deferred.js',
        './uses-loads-static-deferred.js',
        './uses-lateuses-static-deferred.js',
        './loads-lateuses-static-deferred.js',
        './entry.js',
      ],
    })
  })

  it('snapshots an entry that requires a module that has is detected norewrite', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'no-rewrite')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')

    await rmrf(cacheDir)
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

    let stdout: string | undefined

    try {
      ({ stdout } = await exec(cmd, { env }))
      const res = JSON.parse(stdout.trim())

      expect(res.patchedCwd).to.equal(process.cwd())
    } catch (err: any) {
      assert.fail(err.toString())
    }
  }).timeout(10000)
})
