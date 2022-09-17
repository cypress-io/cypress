import path from 'path'
import { SnapshotGenerator } from '../../src/generator/snapshot-generator'
import { exec as execOrig } from 'child_process'
import { promisify } from 'util'
import { electronExecutable } from '../utils/consts'
import { assert, expect } from 'chai'

const exec = promisify(execOrig)

describe('esbuild', () => {
  it('rewrites multi assignments and multi exports', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'rewrites')
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

      expect(res).to.deep.equal({
        multiAssign: {
          first: { base: true, version: 1 },
          second: { base: true, version: 1 },
        },
        multiExport: {
          base: { base: true, version: 1 },
          Base: { base: true, version: 1 },
        },
      })
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })

  it('tests windows-issues', async () => {
    const projectBaseDir = path.join(__dirname, '..', 'fixtures', 'windows-issues')
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

    let stdout

    try {
      ({ stdout } = await exec(cmd, { env }))
      const res = JSON.parse(stdout.trim())

      expect(res.unsupported).to.equal('babel-unsupported')
    } catch (err: any) {
      assert.fail(err.toString())
    }
  })
})
