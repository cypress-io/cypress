import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'
import events from 'events'
import os from 'os'
import path from 'path'
import extract from 'extract-zip'
import cp from 'child_process'
import createDebug from 'debug'
import readline from 'readline'
import fs from 'fs-extra'
import si, { Systeminformation } from 'systeminformation'
import { Console } from 'console'

import logger from '../../../lib/logger'
import util from '../../../lib/util'
import unzip from '../../../lib/tasks/unzip'

const debug = createDebug('test')

const version = '1.2.3'
const installDir = path.join(os.tmpdir(), 'Cypress', version)

vi.mock('extract-zip')
vi.mock('child_process')
vi.mock('readline')
vi.mock('fs-extra')

vi.mock('systeminformation', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      osInfo: vi.fn(),
    },
  }
})

vi.mock('os', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgVersion: vi.fn(),
    },
  }
})

describe('lib/tasks/unzip', function () {
  const createStdoutCapture = () => {
    const logs: string[] = []
    // eslint-disable-next-line no-console
    const originalOut = process.stdout.write

    vi.spyOn(process.stdout, 'write').mockImplementation((strOrBugger: string | Uint8Array<ArrayBufferLike>) => {
      logs.push(strOrBugger as string)

      return originalOut(strOrBugger)
    })

    return () => logs.join('')
  }
  let originalConsole: Console

  beforeEach(async function () {
    vi.resetAllMocks()
    vi.mocked(os.platform).mockReturnValue('darwin')
    vi.mocked(os.arch).mockReturnValue('x64')
    vi.mocked(util.pkgVersion).mockReturnValue(version)
    vi.mocked(si.osInfo).mockResolvedValue({
      distro: 'Foo',
      release: 'OsVersion',
    } as Systeminformation.OsData)

    // @ts-expect-error - default import
    const actualExtract = (await vi.importActual<typeof import('extract-zip')>('extract-zip')).default

    vi.mocked(extract).mockImplementation(actualExtract)

    // @ts-expect-error - default import
    const actualChildProcess = (await vi.importActual<typeof import('child_process')>('child_process')).default

    vi.mocked(cp.spawn).mockImplementation(actualChildProcess.spawn)

    vi.mocked(readline.createInterface).mockImplementation(() => {
      return {
        on: vi.fn(),
      } as any
    })

    originalConsole = globalThis.console
    // Redirect console output to a custom stream or mock
    globalThis.console = new Console(process.stdout, process.stderr)
  })

  afterEach(() => {
    globalThis.console = originalConsole // Restore original console
  })

  it('throws when cannot unzip', async function () {
    const output = createStdoutCapture()

    try {
      await unzip.start({
        zipFilePath: path.join('test', 'fixture', 'bad_example.zip'),
        installDir,
      })
    } catch (err) {
      logger.error(err)

      return expect(output()).toMatchSnapshot()
    }

    throw new Error('should have failed')
  })

  it('throws max path length error when cannot unzip due to realpath ENOENT on windows', async function () {
    const output = createStdoutCapture()

    const err: any = new Error('failed')

    err.code = 'ENOENT'
    err.syscall = 'realpath'

    vi.mocked(os.platform).mockReturnValue('win32')
    vi.mocked(fs.ensureDir).mockRejectedValue(err)

    try {
      await unzip.start({
        zipFilePath: path.join('test', 'fixture', 'bad_example.zip'),
        installDir,
      })
    } catch (err) {
      logger.error(err)

      return expect(output()).toMatchSnapshot()
    }

    throw new Error('should have failed')
  })

  it('can really unzip', async function () {
    const onProgress = vi.fn().mockReturnValue(undefined)

    await unzip.start({
      zipFilePath: path.join('test', 'fixture', 'example.zip'),
      installDir,
      progress: { onProgress },
    })

    expect(onProgress).toHaveBeenCalled()

    await fs.stat(installDir)
  })

  describe('on linux', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('linux')
    })

    it('can try unzip first then fall back to node unzip', async function () {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      vi.mocked(extract).mockImplementation((filePath: any, opts: any) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').toEqual(zipFilePath)

        return Promise.resolve(undefined)
      })

      const unzipChildProcess = new events.EventEmitter()

      // @ts-expect-error - mocking process
      unzipChildProcess.stdout = {
        on: vi.fn(),
      }

      // @ts-expect-error - mocking process
      unzipChildProcess.stderr = {
        on: vi.fn(),
      }

      vi.mocked(cp.spawn).mockImplementation((args: string) => {
        if (args === 'unzip') {
          return unzipChildProcess as any
        }
      })

      setTimeout(() => {
        debug('emitting unzip error')
        unzipChildProcess.emit('error', new Error('unzip fails badly'))
      }, 100)

      await unzip.start({
        zipFilePath,
        installDir,
      })

      debug('checking if unzip was called')
      expect(cp.spawn).toHaveBeenCalledExactlyOnceWith('unzip', ['-o', zipFilePath, '-d', installDir])
      expect(extract).toHaveBeenCalledExactlyOnceWith(zipFilePath, expect.objectContaining({
        dir: installDir,
        onEntry: expect.any(Function),
      }))
    })

    it('can try unzip first then fall back to node unzip and fails with an empty error', async function () {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      vi.mocked(extract).mockRejectedValue(undefined)

      const unzipChildProcess = new events.EventEmitter()

      // @ts-expect-error - mocking process
      unzipChildProcess.stdout = {
        on: vi.fn(),
      }

      // @ts-expect-error - mocking process
      unzipChildProcess.stderr = {
        on: vi.fn(),
      }

      vi.mocked(cp.spawn).mockImplementation((args: string) => {
        if (args === 'unzip') {
          return unzipChildProcess as any
        }
      })

      setTimeout(() => {
        debug('emitting unzip error')
        unzipChildProcess.emit('error', new Error('unzip fails badly'))
      }, 100)

      try {
        await unzip.start({
          zipFilePath,
          installDir,
        })
      } catch (err: any) {
        logger.error(err)
        expect(err.message).toMatch('Unknown error with Node extract tool')

        return
      }
      throw new Error('should have failed')
    })

    it('calls node unzip just once', async function () {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      vi.mocked(extract).mockImplementation((filePath: any, opts: any) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').toEqual(zipFilePath)

        return Promise.resolve(undefined)
      })

      const unzipChildProcess = new events.EventEmitter()

      // @ts-expect-error - mocking process
      unzipChildProcess.stdout = {
        on: vi.fn(),
      }

      // @ts-expect-error - mocking process
      unzipChildProcess.stderr = {
        on: vi.fn(),
      }

      vi.mocked(cp.spawn).mockImplementation((args: string) => {
        if (args === 'unzip') {
          return unzipChildProcess as any
        }
      })

      setTimeout(() => {
        debug('emitting unzip error')
        unzipChildProcess.emit('error', new Error('unzip fails badly'))
      }, 100)

      setTimeout(() => {
        debug('emitting unzip close')
        unzipChildProcess.emit('close', 1)
      }, 110)

      await unzip
      .start({
        zipFilePath,
        installDir,
      })

      debug('checking if unzip was called')
      expect(cp.spawn).toHaveBeenCalledExactlyOnceWith('unzip', ['-o', zipFilePath, '-d', installDir])
      expect(extract).toHaveBeenCalledExactlyOnceWith(zipFilePath, expect.objectContaining({
        dir: installDir,
        onEntry: expect.any(Function),
      }))
    })
  })

  describe('on Mac', () => {
    beforeEach(() => {
      vi.mocked(os.platform).mockReturnValue('darwin')
    })

    it('calls node unzip just once', async function () {
      const zipFilePath = path.join('test', 'fixture', 'example.zip')

      vi.mocked(extract).mockImplementation((filePath: any, opts: any) => {
        debug('unzip extract called with %s', filePath)
        expect(filePath, 'zipfile is the same').toEqual(zipFilePath)

        return Promise.resolve(undefined)
      })

      const unzipChildProcess = new events.EventEmitter()

      // @ts-expect-error - mocking process
      unzipChildProcess.stdout = {
        on: vi.fn(),
      }

      // @ts-expect-error - mocking process
      unzipChildProcess.stderr = {
        on: vi.fn(),
      }

      vi.mocked(cp.spawn).mockImplementation((args: string) => {
        if (args === 'ditto') {
          return unzipChildProcess as any
        }
      })

      setTimeout(() => {
        debug('emitting ditto error')
        unzipChildProcess.emit('error', new Error('ditto fails badly'))
      }, 100)

      setTimeout(() => {
        debug('emitting ditto close')
        unzipChildProcess.emit('close', 1)
      }, 110)

      await unzip.start({
        zipFilePath,
        installDir,
      })

      debug('checking if unzip was called')
      expect(cp.spawn).toHaveBeenCalledExactlyOnceWith('ditto', ['-xkV', zipFilePath, installDir])
      expect(extract).toHaveBeenCalledExactlyOnceWith(zipFilePath, expect.objectContaining({
        dir: installDir,
        onEntry: expect.any(Function),
      }))
    })
  })
})
