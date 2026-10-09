import path from 'path'
import os from 'os'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cypressSessions, getSessionsDir, _resetForTesting } from '../../lib/cypress-sessions'

describe('lib/cypress-sessions', () => {
  let cacheDir: string
  let recordPath: string

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cy-cypress-sessions-'))
    recordPath = path.join(cacheDir, 'sessions', `${process.pid}.json`)

    // resolveCypressCacheRoot also reads the npm_config_/npm_package_config_ variants,
    // so clear them to keep the dev environment from shadowing CYPRESS_CACHE_FOLDER.
    vi.stubEnv('CYPRESS_CACHE_FOLDER', cacheDir)
    vi.stubEnv('npm_config_CYPRESS_CACHE_FOLDER', undefined)
    vi.stubEnv('npm_config_cypress_cache_folder', undefined)
    vi.stubEnv('npm_package_config_CYPRESS_CACHE_FOLDER', undefined)

    _resetForTesting()
  })

  afterEach(async () => {
    _resetForTesting()
    await fs.remove(cacheDir)
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('.getSessionsDir', () => {
    it('resolves to a sessions/ dir under the cache root', () => {
      expect(getSessionsDir()).toBe(path.join(cacheDir, 'sessions'))
    })

    // ProjectBase.open() calls process.chdir(projectRoot) before the session record is
    // written. A relative CYPRESS_CACHE_FOLDER must stay anchored to the launch cwd
    // (which the CLI reader resolves against), not drift to the project root — otherwise
    // the server writes the record to a tree the CLI never reads from.
    it('keeps a relative CYPRESS_CACHE_FOLDER anchored to the launch cwd across a chdir', () => {
      vi.stubEnv('CYPRESS_CACHE_FOLDER', './.cypress-cache-relative')

      const beforeChdir = getSessionsDir()

      // Simulate ProjectBase.open() doing process.chdir(projectRoot) by stubbing the
      // reported cwd rather than mutating the real process state. The resolution must
      // ignore the current cwd entirely (it anchors to the launch cwd captured at module
      // load), so the result stays put and is never resolved under the project root.
      const projectRoot = path.resolve('/some/project/root')

      vi.spyOn(process, 'cwd').mockReturnValue(projectRoot)

      expect(getSessionsDir()).toBe(beforeChdir)
      expect(getSessionsDir()).not.toContain(projectRoot)
    })
  })

  describe('.addSession', () => {
    it('writes a record named by pid with only immutable identity fields', async () => {
      await cypressSessions.addSession({ projectRoot: '/some/project', serverPort: 4455, testingType: 'e2e' })

      const record = await fs.readJson(recordPath)

      expect(record).toEqual(expect.objectContaining({
        schemaVersion: 1,
        pid: process.pid,
        projectRoot: path.resolve('/some/project'),
        serverPort: 4455,
        testingType: 'e2e',
      }))

      expect(record.sessionId).toBeTypeOf('string')
      expect(record.sessionId).toMatch(/^[0-9a-f-]{36}$/)

      expect(record).not.toHaveProperty('cdpBrowserWsUrl')
    })

    it('records the selected testing type', async () => {
      await cypressSessions.addSession({ projectRoot: '/some/project', serverPort: 4455, testingType: 'component' })

      expect(await fs.readJson(recordPath)).toHaveProperty('testingType', 'component')
    })

    it('defaults the testing type to null when none is selected', async () => {
      await cypressSessions.addSession({ projectRoot: '/some/project', serverPort: 4455 })

      expect(await fs.readJson(recordPath)).toHaveProperty('testingType', null)
    })

    it('leaves no temp files behind (atomic write)', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      const entries = await fs.readdir(getSessionsDir())

      expect(entries).toStrictEqual([`${process.pid}.json`])
    })

    it('swallows write failures (cache root is not a directory)', async () => {
      const filePath = path.join(cacheDir, 'not-a-dir')

      await fs.writeFile(filePath, 'x')
      vi.stubEnv('CYPRESS_CACHE_FOLDER', filePath)

      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      expect(await fs.pathExists(path.join(filePath, 'sessions'))).toBe(false)
    })
  })

  describe('.setBrowser', () => {
    it('records the open browser without touching the disk record', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      const onDiskBefore = await fs.readJson(recordPath)

      cypressSessions.setBrowser({ displayName: 'Firefox', family: 'firefox' })

      expect(cypressSessions.getCurrent()).toEqual(expect.objectContaining({
        serverPort: 4455,
        browserName: 'Firefox',
        browserFamily: 'firefox',
      }))

      expect(await fs.readJson(recordPath)).toStrictEqual(onDiskBefore)
    })

    it('clears the browser when it goes away', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      cypressSessions.setBrowser({ displayName: 'Chrome', family: 'chromium' })
      cypressSessions.setBrowser(null)

      expect(cypressSessions.getCurrent()!.browserName).toBeNull()
      expect(cypressSessions.getCurrent()!.browserFamily).toBeNull()
    })

    it('is a no-op when no record has been written yet', () => {
      cypressSessions.setBrowser({ displayName: 'Chrome', family: 'chromium' })

      expect(cypressSessions.getCurrent()).toBeNull()
    })
  })

  describe('.setCdpBrowserWsUrl', () => {
    it('updates the live state without touching the disk record', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      const onDiskBefore = await fs.readJson(recordPath)

      cypressSessions.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')

      expect(cypressSessions.getCurrent()).toEqual(expect.objectContaining({
        serverPort: 4455,
        cdpBrowserWsUrl: 'ws://127.0.0.1:9222/devtools/browser/abc',
      }))

      expect(await fs.readJson(recordPath)).toStrictEqual(onDiskBefore)
    })

    it('leaves the open browser in place when the endpoint goes away', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      cypressSessions.setBrowser({ displayName: 'Chrome', family: 'chromium' })
      cypressSessions.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')
      cypressSessions.setCdpBrowserWsUrl(null)

      expect(cypressSessions.getCurrent()!.cdpBrowserWsUrl).toBeNull()
      expect(cypressSessions.getCurrent()!.browserName).toBe('Chrome')
    })

    it('is a no-op when no record has been written yet', () => {
      cypressSessions.setCdpBrowserWsUrl('ws://127.0.0.1:9222/devtools/browser/abc')

      expect(cypressSessions.getCurrent()).toBeNull()
    })
  })

  describe('.getCurrent', () => {
    it('is null before write and after remove', async () => {
      expect(cypressSessions.getCurrent()).toBeNull()

      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })
      await cypressSessions.remove()

      expect(cypressSessions.getCurrent()).toBeNull()
    })

    it('is the disk record plus the memory-only browser CDP state', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      expect(cypressSessions.getCurrent()).toStrictEqual({
        ...await fs.readJson(recordPath),
        cdpBrowserWsUrl: null,
        browserName: null,
        browserFamily: null,
        machineId: null,
        userId: null,
      })
    })
  })

  describe('.remove', () => {
    it('deletes the record file', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })
      await cypressSessions.remove()

      expect(await fs.pathExists(recordPath)).toBe(false)
    })

    it('is idempotent and never throws', async () => {
      await cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })
      await cypressSessions.remove()
      await cypressSessions.remove()

      expect(await fs.pathExists(recordPath)).toBe(false)
    })

    it('waits out an in-flight persist so the file cannot be resurrected', async () => {
      const writing = cypressSessions.addSession({ projectRoot: '/p', serverPort: 4455 })

      await cypressSessions.remove()
      await writing

      expect(await fs.pathExists(recordPath)).toBe(false)
    })

    // Project switch within the same process (same pid → same record path): a new
    // write() takes over the live state while the previous close()'s remove() is still
    // in flight. The stale remove() must not delete the freshly written record.
    it('does not delete a record a newer write took over on switch', async () => {
      await cypressSessions.addSession({ projectRoot: '/a', serverPort: 4455 })

      // begin removing the first record, then write the second before it completes
      const removing = cypressSessions.remove()

      await cypressSessions.addSession({ projectRoot: '/b', serverPort: 5566 })
      await removing

      expect(await fs.pathExists(recordPath)).toBe(true)

      expect(await fs.readJson(recordPath)).toEqual(expect.objectContaining({
        projectRoot: path.resolve('/b'),
        serverPort: 5566,
      }))

      expect(cypressSessions.getCurrent()).toEqual(expect.objectContaining({ serverPort: 5566 }))
    })
  })
})
