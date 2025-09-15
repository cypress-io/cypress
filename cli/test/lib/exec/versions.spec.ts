import { vi, describe, it, beforeEach, expect } from 'vitest'
import util from '../../../lib/util'
import state from '../../../lib/tasks/state'
import versions from '../../../lib/exec/versions'

vi.mock('../../../lib/util', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      pkgBuildInfo: vi.fn(),
      pkgVersion: vi.fn(),
    },
  }
})

vi.mock('../../../lib/tasks/state', async (importActual) => {
  const actual = await importActual()

  return {
    default: {
      // @ts-expect-error
      ...actual.default,
      getBinaryDir: vi.fn(),
      getBinaryPkgAsync: vi.fn(),
      parseRealPlatformBinaryFolderAsync: vi.fn(),
    },
  }
})

describe('lib/exec/versions', function () {
  const binaryDir = '/cache/1.2.3/Cypress.app'

  beforeEach(function (): void {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
    // @ts-expect-error - mockReturnValue
    state.getBinaryDir.mockReturnValue(binaryDir)

    // @ts-expect-error - mockImplementation
    state.getBinaryPkgAsync.mockImplementation((args: string) => {
      if (args === binaryDir) {
        return {
          version: '1.2.3',
          electronVersion: '10.1.2',
          electronNodeVersion: '12.16.3',
        }
      }

      throw new Error('not found')
    })

    // @ts-expect-error - mockReturnValue
    util.pkgVersion.mockReturnValue('4.5.6')

    // @ts-expect-error - mockReturnValue
    util.pkgBuildInfo.mockReturnValue({ stable: true })
  })

  describe('.getVersions', () => {
    it('gets the correct binary and package version', async () => {
      const { package: pkg, binary } = await versions.getVersions()

      expect(pkg, 'package version').toEqual('4.5.6')
      expect(binary, 'binary version').toEqual('1.2.3')
    })

    it('gets the correct Electron and bundled Node version', async () => {
      const { electronVersion, electronNodeVersion } = await versions.getVersions()

      expect(electronVersion, 'electron version').toEqual('10.1.2')
      expect(electronNodeVersion, 'node version').toEqual('12.16.3')
    })

    it('gets correct binary version if CYPRESS_RUN_BINARY', async () => {
      // @ts-expect-error - mockImplementation
      state.parseRealPlatformBinaryFolderAsync.mockResolvedValue('/my/cypress/path')
      vi.stubEnv('CYPRESS_RUN_BINARY', '/my/cypress/path')

      // @ts-expect-error
      state.getBinaryPkgAsync.mockImplementation((args: string) => {
        if (args === '/my/cypress/path') {
          return {
            version: '7.8.9',
          }
        }

        throw new Error('not found')
      })

      const { package: pkg, binary } = await versions.getVersions()

      expect(pkg).toEqual('4.5.6')
      expect(binary).toEqual('7.8.9')
    })

    it('appends pre-release if not stable', async () => {
    // @ts-expect-error - mockReturnValue
      util.pkgBuildInfo.mockReturnValue({ stable: false })

      const version = await versions.getVersions()

      expect(version.package).to.eql('4.5.6 (pre-release)')
    })

    it('appends development if missing buildInfo', async () => {
    // @ts-expect-error - mockReturnValue
      util.pkgBuildInfo.mockReturnValue(undefined)
      const version = await versions.getVersions()

      expect(version.package).to.eql('4.5.6 (development)')
    })

    it('reports default versions if not found', async () => {
      // imagine package.json only has version there
      // @ts-expect-error - mockImplementation
      state.getBinaryPkgAsync.mockImplementation((args: string) => {
        if (args === binaryDir) {
          return {
            version: '90.9.9',
          }
        }

        throw new Error('not found')
      })

      const version = await versions.getVersions()

      expect(version).toEqual({
        'package': '4.5.6',
        'binary': '90.9.9',
        'electronVersion': 'not found',
        'electronNodeVersion': 'not found',
      })
    })
  })
})
