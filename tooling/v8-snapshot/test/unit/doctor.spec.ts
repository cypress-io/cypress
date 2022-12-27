import path from 'path'
import { readBundleResult, readSnapshotResult } from '../utils/bundle'
import { SnapshotGenerator } from '../../src/generator/snapshot-generator'
import { Flag } from '../../src/generator/snapshot-generator-flags'
import { electronExecutable } from '../utils/consts'
import { expect, assert } from 'chai'
import { promisify } from 'util'
import { exec as execOrig } from 'child_process'
import fs from 'fs-extra'

const exec = promisify(execOrig)

describe('doctor', () => {
  let originalV8UpdateMetafile

  before(() => {
    originalV8UpdateMetafile = process.env.V8_UPDATE_METAFILE
    process.env.V8_UPDATE_METAFILE = '1'
  })

  after(() => {
    process.env.V8_UPDATE_METAFILE = originalV8UpdateMetafile
  })

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
      deferredHashFile: 'yarn.lock',
      deferredHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      healthy: ['./entry.js', './valid-module.js'],
    })

    expect({
      keys: Object.keys(exported),
    }).to.deep.equal({
      keys: ['./valid-module.js', './accessing-buffer.js', './entry.js'],
    })
  })

  it('snapshots entry points modules using and reassigning console', async () => {
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
      deferredHashFile: 'yarn.lock',
      deferredHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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

    await fs.remove(cacheDir)
    const generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    const env: Record<string, any> = {
      ELECTRON_RUN_AS_NODE: 1,
      DEBUG: process.env.DEBUG ?? '(cypress:packherd|cypress:snapgen|cypress:snapshot):*',
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
  })

  it('snapshots using dir/file name delayed and during init', async () => {
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
      deferredHashFile: 'yarn.lock',
      deferredHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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
      deferredHashFile: 'yarn.lock',
      deferredHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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
      deferredHashFile: 'yarn.lock',
      deferredHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
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

    await fs.remove(cacheDir)
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

    let stdout: string | undefined

    try {
      ({ stdout } = await exec(cmd, { env }))
      const res = JSON.parse(stdout.trim())

      expect(res.patchedCwd).to.equal(process.cwd())
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })

  it('snapshots an entry, replaces an intermediate healthy file with an intermediate deferred file, and snapshots again', async () => {
    const templateDir = path.join(__dirname, '..', 'fixtures', 'iterative', 'templates')
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'iterative', 'project')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')

    await fs.remove(cacheDir)
    let generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    // Set up project to use an intermediate healthy dependency and snapshot
    const initialEntry = await fs.readFile(path.join(templateDir, 'entry-intermediate-healthy.js'))
    const healthy = await fs.readFile(path.join(templateDir, 'leaf-healthy.js'))
    const deferred = await fs.readFile(path.join(templateDir, 'leaf-deferred.js'))
    const intermediateHealthy = await fs.readFile(path.join(templateDir, 'intermediate-healthy.js'))
    const intermediateDeferred = await fs.readFile(path.join(templateDir, 'intermediate-deferred.js'))
    const norewrite = await fs.readFile(path.join(templateDir, 'leaf-norewrite.js'))

    await fs.writeFile(path.join(projectBaseDir, 'entry.js'), initialEntry)
    await fs.writeFile(path.join(projectBaseDir, 'healthy.js'), healthy)
    await fs.writeFile(path.join(projectBaseDir, 'deferred.js'), deferred)
    await fs.writeFile(path.join(projectBaseDir, 'intermediate-healthy.js'), intermediateHealthy)
    await fs.writeFile(path.join(projectBaseDir, 'intermediate-deferred.js'), intermediateDeferred)
    await fs.writeFile(path.join(projectBaseDir, 'norewrite.js'), norewrite)

    await generator.createScript()
    await generator.makeAndInstallSnapshot()
    let { meta: { deferredHash, deferredHashFile, ...metadata } } = readSnapshotResult(cacheDir)

    expect(metadata).to.deep.equal({
      norewrite: [
        './norewrite.js',
      ],
      deferred: [
        './deferred.js',
      ],
      healthy: [
        './entry.js',
        './healthy.js',
        './intermediate-healthy.js',
      ],
    })

    generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      previousDeferred: metadata.deferred,
      previousHealthy: metadata.healthy,
      previousNoRewrite: metadata.norewrite,
    })

    // Switch project to use an intermediate deferred dependency and re-snapshot
    const updatedEntry = await fs.readFile(path.join(templateDir, 'entry-intermediate-deferred.js'))

    await fs.writeFile(path.join(projectBaseDir, 'entry.js'), updatedEntry)

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    ;({ meta: { deferredHash, deferredHashFile, ...metadata } } = readSnapshotResult(cacheDir))

    expect(metadata).to.deep.equal({
      norewrite: [
        './norewrite.js',
      ],
      deferred: [
        './deferred.js',
        './intermediate-deferred.js',
      ],
      healthy: [
        './entry.js',
        './healthy.js',
      ],
    })
  })

  // TODO: We still have a hole where a file moves from healthy to deferred or norewrite. This doesn't happen very frequently and can be solved later:
  // https://github.com/cypress-io/cypress/issues/23690
  it.skip('snapshots an entry, typescripts an intermediate file, and snapshots again', async () => {
    const templateDir = path.join(__dirname, '..', 'fixtures', 'iterative', 'templates')
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'iterative', 'project')
    const cacheDir = path.join(projectBaseDir, 'cache')
    const snapshotEntryFile = path.join(projectBaseDir, 'entry.js')

    await fs.remove(cacheDir)
    let generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
    })

    // Set up project with a healthy and no rewrite leaf
    const entry = await fs.readFile(path.join(templateDir, 'entry-base.js'))
    const healthy = await fs.readFile(path.join(templateDir, 'leaf-healthy.js'))
    const norewrite = await fs.readFile(path.join(templateDir, 'leaf-norewrite.js'))

    await fs.writeFile(path.join(projectBaseDir, 'entry.js'), entry)
    await fs.writeFile(path.join(projectBaseDir, 'healthy.js'), healthy)
    await fs.writeFile(path.join(projectBaseDir, 'norewrite.js'), norewrite)

    // First create the snapshot with an intermediate healthy file
    const initialEntry = await fs.readFile(path.join(templateDir, 'intermediate-healthy.js'))

    await fs.writeFile(path.join(projectBaseDir, 'intermediate.js'), initialEntry)

    await generator.createScript()
    await generator.makeAndInstallSnapshot()
    let { meta: { deferredHash, deferredHashFile, ...metadata } } = readSnapshotResult(cacheDir)

    expect(metadata).to.deep.equal({
      norewrite: [
        './norewrite.js',
      ],
      deferred: [],
      healthy: [
        './entry.js',
        './healthy.js',
        './intermediate.js',
      ],
    })

    generator = new SnapshotGenerator(projectBaseDir, snapshotEntryFile, {
      cacheDir,
      nodeModulesOnly: false,
      previousDeferred: metadata.deferred,
      previousHealthy: metadata.healthy,
      previousNoRewrite: metadata.norewrite,
    })

    // Then create the snapshot with a intermediate deferred file
    const updatedEntry = await fs.readFile(path.join(templateDir, 'intermediate-deferred.js'))

    await fs.writeFile(path.join(projectBaseDir, 'intermediate.js'), updatedEntry)

    await generator.createScript()
    await generator.makeAndInstallSnapshot()

    ;({ meta: { deferredHash, deferredHashFile, ...metadata } } = readSnapshotResult(cacheDir))

    expect(metadata).to.deep.equal({
      norewrite: [
        './norewrite.js',
      ],
      deferred: [
        './intermediate-deferred.js',
      ],
      healthy: [
        './entry.js',
        './healthy.js',
        './intermediate-healthy.js',
      ],
    })
  })
})
