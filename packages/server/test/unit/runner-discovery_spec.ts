import '../spec_helper'
import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import mockedEnv from 'mocked-env'
import { runnerDiscovery, getRunnerDiscoveryDir, _resetForTesting } from '../../lib/runner-discovery'

describe('lib/runner-discovery', () => {
  let restoreEnv: () => void
  let cacheDir: string
  let recordPath: string

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cy-runner-discovery-'))
    recordPath = path.join(cacheDir, 'instances', `${process.pid}.json`)

    // resolveCypressCacheRoot also reads the npm_config_/npm_package_config_ variants,
    // so clear them to keep the dev environment from shadowing CYPRESS_CACHE_FOLDER.
    restoreEnv = mockedEnv({
      CYPRESS_CACHE_FOLDER: cacheDir,
      npm_config_CYPRESS_CACHE_FOLDER: undefined,
      npm_config_cypress_cache_folder: undefined,
      npm_package_config_CYPRESS_CACHE_FOLDER: undefined,
    })

    _resetForTesting()
  })

  afterEach(async () => {
    _resetForTesting()
    await fs.remove(cacheDir)
    restoreEnv()
  })

  describe('.getRunnerDiscoveryDir', () => {
    it('resolves to an instances/ dir under the cache root', () => {
      expect(getRunnerDiscoveryDir()).to.eq(path.join(cacheDir, 'instances'))
    })

    // ProjectBase.open() calls process.chdir(projectRoot) before the runner record is
    // written. A relative CYPRESS_CACHE_FOLDER must stay anchored to the launch cwd
    // (which the CLI reader resolves against), not drift to the project root — otherwise
    // the server writes the record to a tree the CLI never reads from.
    it('keeps a relative CYPRESS_CACHE_FOLDER anchored to the launch cwd across a chdir', () => {
      process.env.CYPRESS_CACHE_FOLDER = './.cypress-cache-relative'

      const beforeChdir = getRunnerDiscoveryDir()

      // Simulate ProjectBase.open() doing process.chdir(projectRoot) by stubbing the
      // reported cwd rather than mutating the real process state. The resolution must
      // ignore the current cwd entirely (it anchors to the launch cwd captured at module
      // load), so the result stays put and is never resolved under the project root.
      const projectRoot = path.resolve('/some/project/root')

      sinon.stub(process, 'cwd').returns(projectRoot)

      expect(getRunnerDiscoveryDir()).to.eq(beforeChdir)
      expect(getRunnerDiscoveryDir()).to.not.contain(projectRoot)
    })
  })

  describe('.captureRecord', () => {
    it('writes a record named by pid with only immutable identity fields', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/some/project', serverPort: 4455, testingType: 'e2e' })

      const record = await fs.readJson(recordPath)

      expect(record).to.deep.include({
        schemaVersion: 1,
        pid: process.pid,
        projectRoot: path.resolve('/some/project'),
        serverPort: 4455,
        testingType: 'e2e',
      })

      expect(record.instanceId).to.be.a('string').and.match(/^[0-9a-f-]{36}$/)

      expect(record).to.not.have.property('cdpBrowserWsUrl')
    })

    it('records the selected testing type', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/some/project', serverPort: 4455, testingType: 'component' })

      expect(await fs.readJson(recordPath)).to.have.property('testingType', 'component')
    })

    it('defaults the testing type to null when none is selected', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/some/project', serverPort: 4455 })

      expect(await fs.readJson(recordPath)).to.have.property('testingType', null)
    })

    it('leaves no temp files behind (atomic write)', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

      const entries = await fs.readdir(getRunnerDiscoveryDir())

      expect(entries).to.eql([`${process.pid}.json`])
    })

    it('swallows write failures (cache root is not a directory)', async () => {
      const filePath = path.join(cacheDir, 'not-a-dir')

      await fs.writeFile(filePath, 'x')
      process.env.CYPRESS_CACHE_FOLDER = filePath

      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

      expect(await fs.pathExists(path.join(filePath, 'instances'))).to.be.false
    })
  })

  describe('.setCdpBrowserWsUrl', () => {
    it('updates the live state without touching the disk record', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

      const onDiskBefore = await fs.readJson(recordPath)

      runnerDiscovery.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')

      expect(runnerDiscovery.getCurrent()).to.deep.include({
        serverPort: 4455,
        cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      })

      expect(await fs.readJson(recordPath)).to.deep.eq(onDiskBefore)
    })

    it('clears the endpoint when the browser goes away', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

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

      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()

      expect(runnerDiscovery.getCurrent()).to.be.null
    })

    it('is the disk record plus the memory-only browser CDP state', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

      expect(runnerDiscovery.getCurrent()).to.deep.eq({
        ...await fs.readJson(recordPath),
        cdpBrowserWsUrl: null,
      })
    })
  })

  describe('.remove', () => {
    it('deletes the record file', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('is idempotent and never throws', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })
      await runnerDiscovery.remove()
      await runnerDiscovery.remove()

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    it('waits out an in-flight persist so the file cannot be resurrected', async () => {
      const writing = runnerDiscovery.captureRecord({ projectRoot: '/p', serverPort: 4455 })

      await runnerDiscovery.remove()
      await writing

      expect(await fs.pathExists(recordPath)).to.be.false
    })

    // Project switch within the same process (same pid → same record path): a new
    // write() takes over the live state while the previous close()'s remove() is still
    // in flight. The stale remove() must not delete the freshly written record.
    it('does not delete a record a newer write took over on switch', async () => {
      await runnerDiscovery.captureRecord({ projectRoot: '/a', serverPort: 4455 })

      // begin removing the first record, then write the second before it completes
      const removing = runnerDiscovery.remove()

      await runnerDiscovery.captureRecord({ projectRoot: '/b', serverPort: 5566 })
      await removing

      expect(await fs.pathExists(recordPath)).to.be.true

      expect(await fs.readJson(recordPath)).to.deep.include({
        projectRoot: path.resolve('/b'),
        serverPort: 5566,
      })

      expect(runnerDiscovery.getCurrent()).to.include({ serverPort: 5566 })
    })
  })
})
