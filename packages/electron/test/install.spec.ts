import { describe, it, expect, beforeEach, afterEach, vi, MockInstance } from 'vitest'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import { createRequire } from 'module'
import { Readable } from 'stream'
import execa from 'execa'
import systeminformation from 'systeminformation'
import { getPathToIcon } from '@packages/icons'
import { getPathToExec, getPathToResources, getPathToVersion } from '../src/paths'

const { ELECTRON_VERSION, packager } = vi.hoisted(() => {
  return {
    ELECTRON_VERSION: '35.0.0',
    packager: vi.fn(),
  }
})

// `install.ts` requires `@electron/packager` dynamically so mksnapshot cannot
// discover it, which also puts it out of reach of `vi.mock`. Seeding node's own
// module cache is what keeps a unit test from packaging a real binary.
const installRequire = createRequire(new URL('../src/install.ts', import.meta.url))
const packagerPath = installRequire.resolve('@electron/packager')

installRequire.cache[packagerPath] = {
  id: packagerPath,
  filename: packagerPath,
  loaded: true,
  exports: packager,
} as NodeJS.Module

vi.mock('@packages/root', () => {
  return {
    default: {
      devDependencies: {
        electron: ELECTRON_VERSION,
      },
    },
  }
})

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof import('os') & { default: typeof import('os') }>('os')

  return {
    ...actual,
    default: {
      ...actual.default,
      platform: vi.fn(),
      arch: vi.fn(),
    },
  }
})

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs') & { default: typeof import('fs') }>('fs')

  return {
    ...actual,
    createReadStream: vi.fn(),
    default: {
      ...actual.default,
      createReadStream: vi.fn(),
    },
  }
})

vi.mock('fs/promises', () => {
  return {
    default: {
      readFile: vi.fn(),
      stat: vi.fn(),
    },
  }
})

vi.mock('fs-extra', () => {
  return {
    move: vi.fn(),
    remove: vi.fn(),
  }
})

vi.mock('execa', () => {
  return {
    default: vi.fn(),
  }
})

vi.mock('systeminformation', () => {
  return {
    default: {
      cpu: vi.fn(),
    },
  }
})

vi.mock('@electron/fuses', () => {
  return {
    flipFuses: vi.fn(),
    FuseVersion: { V1: 'v1' },
    FuseV1Options: { LoadBrowserProcessSpecificV8Snapshot: 'LoadBrowserProcessSpecificV8Snapshot' },
  }
})

import { check, ensure } from '../src/install'

describe('install', () => {
  // the only paths `getFileHash` can read, mapped to their contents
  let files: Map<string, string>

  const setUpToDateBinary = (platform: string, arch = 'x64') => {
    vi.mocked(os.platform).mockReturnValue(platform as NodeJS.Platform)
    vi.mocked(os.arch).mockReturnValue(arch as NodeJS.Architecture)

    vi.mocked(fs.readFile).mockResolvedValue(`v${ELECTRON_VERSION}`)
    vi.mocked(fs.stat).mockResolvedValue({} as any)

    files.set(getPathToIcon('cypress.icns'), 'cypress icon')
    files.set(getPathToResources('electron.icns'), 'cypress icon')

    vi.mocked(execa).mockResolvedValue({ stdout: arch } as any)
    vi.mocked(systeminformation.cpu).mockResolvedValue({ manufacturer: 'Intel' } as any)
  }

  beforeEach(() => {
    files = new Map()
    packager.mockReset()

    vi.mocked(createReadStream).mockImplementation((filePath) => {
      const contents = files.get(String(filePath))

      if (contents === undefined) {
        const missing = new Readable({ read () {} })

        missing.destroy(Object.assign(new Error(`ENOENT: no such file or directory, open '${filePath}'`), { code: 'ENOENT' }))

        return missing as any
      }

      return Readable.from([contents]) as any
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ensure', () => {
    for (const platform of ['darwin', 'linux', 'win32']) {
      it(`resolves on ${platform} when the binary is present and current`, async () => {
        setUpToDateBinary(platform)

        await expect(ensure()).resolves.toBeUndefined()
      })
    }

    it('reads the version and the executable from the packaged binary', async () => {
      setUpToDateBinary('linux')

      await ensure()

      expect(fs.readFile).toHaveBeenCalledWith(getPathToVersion(), 'utf8')
      expect(fs.stat).toHaveBeenCalledWith(getPathToExec())
    })

    it('rejects when the installed version does not match the electron devDependency', async () => {
      setUpToDateBinary('linux')
      vi.mocked(fs.readFile).mockResolvedValue('v34.0.0')

      await expect(ensure()).rejects.toThrow(`Currently installed version: '34.0.0' does not match electronVersion: '${ELECTRON_VERSION}`)
    })

    it('rejects when the executable is missing', async () => {
      setUpToDateBinary('linux')
      vi.mocked(fs.stat).mockRejectedValue(new Error('ENOENT: no such file or directory'))

      await expect(ensure()).rejects.toThrow('ENOENT')
    })

    describe('icon check', () => {
      it('compares against the icon cached inside the packaged app on darwin', async () => {
        setUpToDateBinary('darwin')

        await ensure()

        expect(createReadStream).toHaveBeenCalledWith(getPathToIcon('cypress.icns'))
        expect(createReadStream).toHaveBeenCalledWith(expect.stringContaining(
          path.join('dist', 'Cypress', 'Cypress.app', 'Contents', 'Resources', 'electron.icns'),
        ))
      })

      it('rejects on darwin when the cached icon differs from the icons package', async () => {
        setUpToDateBinary('darwin')
        files.set(getPathToResources('electron.icns'), 'a stale icon')

        await expect(ensure()).rejects.toThrow('does not match')
      })

      it('rejects on darwin when the packaged app has no cached icon', async () => {
        setUpToDateBinary('darwin')
        files.delete(getPathToResources('electron.icns'))

        await expect(ensure()).rejects.toThrow('ENOENT')
      })

      for (const platform of ['linux', 'win32']) {
        it(`does not look for a cached icon on ${platform}`, async () => {
          setUpToDateBinary(platform)
          files.clear()

          await expect(ensure()).resolves.toBeUndefined()
          expect(createReadStream).not.toHaveBeenCalled()
        })
      }
    })

    describe('arch check', () => {
      it('resolves on darwin x64 when the binary arch matches the CPU', async () => {
        setUpToDateBinary('darwin', 'x64')

        await expect(ensure()).resolves.toBeUndefined()
        expect(execa).toHaveBeenCalledWith('lipo', ['-archs', getPathToExec()])
      })

      it('rejects on darwin x64 when an x64 binary is running on an Apple CPU', async () => {
        setUpToDateBinary('darwin', 'x64')
        vi.mocked(systeminformation.cpu).mockResolvedValue({ manufacturer: 'Apple' } as any)

        await expect(ensure()).rejects.toThrow(`built binary arch: 'x64' does not match system CPU arch: 'arm64'`)
      })

      for (const { platform, arch } of [
        { platform: 'darwin', arch: 'arm64' },
        { platform: 'linux', arch: 'x64' },
        { platform: 'win32', arch: 'x64' },
      ]) {
        it(`does not shell out to lipo on ${platform} ${arch}`, async () => {
          setUpToDateBinary(platform, arch)

          await expect(ensure()).resolves.toBeUndefined()
          expect(execa).not.toHaveBeenCalled()
        })
      }
    })
  })

  describe('check', () => {
    let exit: MockInstance<typeof process.exit>

    beforeEach(() => {
      exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
      packager.mockResolvedValue(['/tmp/Cypress-out/Cypress'])
    })

    for (const platform of ['darwin', 'linux', 'win32']) {
      it(`does not re-package on ${platform} when the binary is present and current`, async () => {
        setUpToDateBinary(platform)

        await check()

        expect(packager).not.toHaveBeenCalled()
        expect(exit).not.toHaveBeenCalled()
      })
    }

    it('re-packages when the installed binary is out of date', async () => {
      setUpToDateBinary('linux')
      vi.mocked(fs.readFile).mockResolvedValue('v34.0.0')

      await check()

      expect(packager).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Cypress',
        electronVersion: ELECTRON_VERSION,
        platform: 'linux',
        arch: 'x64',
      }))

      expect(exit).toHaveBeenCalled()
    })

    it('re-packages when the binary is missing', async () => {
      setUpToDateBinary('linux')
      vi.mocked(fs.stat).mockRejectedValueOnce(new Error('ENOENT: no such file or directory'))

      await check()

      expect(packager).toHaveBeenCalled()
      expect(exit).toHaveBeenCalled()
    })
  })
})
