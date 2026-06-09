import '../spec_helper'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import pkg from '@packages/root'
import { runnerDiscovery, getRunnerDiscoveryDir, _resetForTesting } from '../../lib/runner-discovery'

const ENV_KEYS = [
  'CYPRESS_CACHE_FOLDER',
  'npm_config_CYPRESS_CACHE_FOLDER',
  'npm_config_cypress_cache_folder',
  'npm_package_config_CYPRESS_CACHE_FOLDER',
  'CYPRESS_INTERNAL_RUNNER_DISCOVERY',
]

describe('lib/runner-discovery', () => {
  const snapshot: Record<string, string | undefined> = {}
  let cacheDir: string
  let recordPath: string

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      snapshot[k] = process.env[k]
      delete process.env[k]
    }

    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cy-runner-discovery-'))
    process.env.CYPRESS_CACHE_FOLDER = cacheDir
    recordPath = path.join(cacheDir, 'runners', `${process.pid}.json`)
    _resetForTesting()
  })

  afterEach(async () => {
    _resetForTesting()
    await fs.remove(cacheDir)

    for (const k of ENV_KEYS) {
      if (snapshot[k] === undefined) delete process.env[k]
      else process.env[k] = snapshot[k]
    }
  })

  describe('.getRunnerDiscoveryDir', () => {
    it('resolves to a runners/ dir under the cache root', () => {
      expect(getRunnerDiscoveryDir()).to.eq(path.join(cacheDir, 'runners'))
    })
  })

  describe('.write', () => {
    it('writes a record named by pid with no browser attached', async () => {
      await runnerDiscovery.write({ projectRoot: '/some/project', runnerOrigin: 'http://localhost:1234' })

      const record = await fs.readJson(recordPath)

      expect(record).to.deep.include({
        schemaVersion: 2,
        pid: process.pid,
        cypressVersion: pkg.version,
        projectRoot: path.resolve('/some/project'),
        runnerOrigin: 'http://localhost:1234',
        cdpStatus: 'no_browser',
        cdpHost: null,
        cdpPort: null,
        cdpBrowserWsUrl: null,
      })

      expect(record.createdAt).to.be.a('number')
    })

    it('leaves no temp files behind (atomic write)', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })

      const entries = await fs.readdir(getRunnerDiscoveryDir())

      expect(entries).to.eql([`${process.pid}.json`])
    })

    it('does nothing when disabled via env', async () => {
      process.env.CYPRESS_INTERNAL_RUNNER_DISCOVERY = '0'

      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('swallows write failures (cache root is not a directory)', async () => {
      // Point the cache folder at a regular file so ensureDir() fails.
      const filePath = path.join(cacheDir, 'not-a-dir')

      await fs.writeFile(filePath, 'x')
      process.env.CYPRESS_CACHE_FOLDER = filePath

      // Resolves rather than throwing — the run must survive a failed write.
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })

      expect(await fs.pathExists(path.join(filePath, 'runners'))).to.be.false
    })
  })

  describe('.update', () => {
    it('merge-patches cdp fields onto the existing record', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })
      await runnerDiscovery.update({ cdpStatus: 'ready', cdpHost: '127.0.0.1', cdpPort: 9222, cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc' })

      const record = await fs.readJson(recordPath)

      expect(record).to.deep.include({
        cdpStatus: 'ready',
        cdpHost: '127.0.0.1',
        cdpPort: 9222,
        cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
        runnerOrigin: 'http://localhost:1',
      })
    })

    it('re-creates a record whose file was deleted out from under it', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })
      await fs.remove(recordPath)

      await runnerDiscovery.update({ cdpStatus: 'ready', cdpHost: '127.0.0.1', cdpPort: 9222 })

      expect(await fs.pathExists(recordPath)).to.be.true

      const record = await fs.readJson(recordPath)

      expect(record.cdpStatus).to.eq('ready')
    })

    it('is a no-op when no record has been written yet', async () => {
      await runnerDiscovery.update({ cdpStatus: 'ready', cdpHost: '127.0.0.1', cdpPort: 9222 })

      expect(await fs.pathExists(recordPath)).to.be.false
    })
  })

  describe('.remove', () => {
    it('deletes the record file', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('is idempotent and never throws', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', runnerOrigin: 'http://localhost:1' })
      await runnerDiscovery.remove()
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })
  })
})
