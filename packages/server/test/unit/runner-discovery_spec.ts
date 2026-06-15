import '../spec_helper'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
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
    it('writes a record named by pid with only immutable identity fields', async () => {
      await runnerDiscovery.write({ projectRoot: '/some/project', serverPort: 4455 })

      const record = await fs.readJson(recordPath)

      expect(record).to.deep.include({
        schemaVersion: 1,
        pid: process.pid,
        projectRoot: path.resolve('/some/project'),
        serverPort: 4455,
      })

      // Random per-process token backing the liveness probe.
      expect(record.instanceId).to.be.a('string').and.match(/^[0-9a-f-]{36}$/)

      // Browser CDP state is memory-only: it travels in the probe response,
      // never in the file.
      expect(record).to.not.have.property('cdpBrowserWsUrl')
    })

    it('leaves no temp files behind (atomic write)', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      const entries = await fs.readdir(getRunnerDiscoveryDir())

      expect(entries).to.eql([`${process.pid}.json`])
    })

    it('does nothing when disabled via env', async () => {
      process.env.CYPRESS_INTERNAL_RUNNER_DISCOVERY = '0'

      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('swallows write failures (cache root is not a directory)', async () => {
      // Point the cache folder at a regular file so ensureDir() fails.
      const filePath = path.join(cacheDir, 'not-a-dir')

      await fs.writeFile(filePath, 'x')
      process.env.CYPRESS_CACHE_FOLDER = filePath

      // Resolves rather than throwing — the run must survive a failed write.
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      expect(await fs.pathExists(path.join(filePath, 'runners'))).to.be.false
    })
  })

  describe('.setCdpBrowserWsUrl', () => {
    it('updates the live state without touching the disk record', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      const onDiskBefore = await fs.readJson(recordPath)

      runnerDiscovery.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')

      expect(runnerDiscovery.getCurrent()).to.deep.include({
        serverPort: 4455,
        cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      })

      expect(await fs.readJson(recordPath)).to.deep.eq(onDiskBefore)
    })

    it('clears the endpoint when the browser goes away', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      runnerDiscovery.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')
      runnerDiscovery.setCdpBrowserWsUrl(null)

      expect(runnerDiscovery.getCurrent()!.cdpBrowserWsUrl).to.be.null
    })

    it('is a no-op when no record has been written yet', () => {
      runnerDiscovery.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')

      expect(runnerDiscovery.getCurrent()).to.be.null
    })
  })

  describe('.getCurrent', () => {
    it('is null before write and after remove', async () => {
      expect(runnerDiscovery.getCurrent()).to.be.null

      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()

      expect(runnerDiscovery.getCurrent()).to.be.null
    })

    it('is the disk record plus the memory-only browser CDP state', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      // The probe route answers from this object; it must agree with the
      // disk record on every persisted field.
      expect(runnerDiscovery.getCurrent()).to.deep.eq({
        ...await fs.readJson(recordPath),
        cdpBrowserWsUrl: null,
      })
    })
  })

  describe('.remove', () => {
    it('deletes the record file', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('is idempotent and never throws', async () => {
      await runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('waits out an in-flight persist so the file cannot be resurrected', async () => {
      // Don't await: the persist is still in flight when remove() starts.
      const writing = runnerDiscovery.write({ projectRoot: '/p', serverPort: 4455 })

      await runnerDiscovery.remove()
      await writing

      expect(await fs.pathExists(recordPath)).to.be.false
    })
  })
})
