import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest'
import os from 'os'
import { getPathToDist, getPathToExec, getPathToResources, pkgRoot } from '../src/paths'
import { existsSync } from 'fs'
import path from 'path'

vi.mock('os', () => {
  return {
    default: {
      platform: vi.fn(),
    },
  }
})

vi.mock('fs', async () => {
  return {
    ...(await vi.importActual('fs')),
    existsSync: vi.fn(),
  }
})

vi.mock('path', async () => {
  return {
    ...(await vi.importActual('path')),
    resolve: vi.fn(),
    dirname: vi.fn(),
    default: {
      ...(await vi.importActual('path')).default,
      resolve: vi.fn(),
      dirname: vi.fn(),
    },
  }
})

describe('paths', () => {
  const dir = '/package/src'
  const root = '/package'

  let originalPath: typeof path

  beforeEach(async () => {
    originalPath = await vi.importActual('path')
    vi.mocked(path.resolve).mockImplementation((...args) => {
      return originalPath.resolve(originalPath.join('/', ...args))
    })

    vi.mocked(path.dirname).mockImplementation((filePath) => {
      return filePath === originalPath.resolve(__dirname, '../src') ? root : originalPath.dirname(filePath)
    })

    vi.mocked(existsSync).mockImplementation((filePath) => {
      if (filePath === `${root}/package.json`) {
        return true
      }

      return false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getPathToDist', () => {
    const testDir = 'test'

    it('returns the correct path to the dist directory', async () => {
      expect(getPathToDist(testDir)).to.eq('/package/dist/Cypress/test')
    })
  })

  describe('getPathToExec', () => {
    const matrix = [
      { platform: 'darwin', expected: '/package/dist/Cypress/Cypress.app/Contents/MacOS/Cypress' },
      { platform: 'linux', expected: '/package/dist/Cypress/Cypress' },
      { platform: 'win32', expected: '/package/dist/Cypress/Cypress.exe' },
      { platform: 'freebsd', expected: '/package/dist/Cypress/Cypress' },
    ]

    for (const { platform, expected } of matrix) {
      it(`returns the correct dist path to the exec directory for ${platform}`, async () => {
        vi.mocked(os.platform).mockReturnValue(platform as NodeJS.Platform)

        expect(getPathToExec()).to.eq(expected)
      })
    }
  })

  describe('getPathToResources', () => {
    const matrix = [
      { platform: 'darwin', expected: '/package/dist/Cypress/Cypress.app/Contents/Resources' },
      { platform: 'linux', expected: '/package/dist/Cypress/resources' },
      { platform: 'win32', expected: '/package/dist/Cypress/resources' },
      { platform: 'freebsd', expected: '/package/dist/Cypress/resources' },
    ]

    for (const { platform, expected } of matrix) {
      it(`returns the correct dist path to the resources directory for ${platform}`, async () => {
        vi.mocked(os.platform).mockReturnValue(platform as NodeJS.Platform)

        expect(getPathToResources()).to.eq(expected)
      })
    }
  })

  describe('pkgRoot', () => {
    it('does not get caught in an infinite loop', async () => {
      vi.mocked(path.dirname).mockImplementation((...args) => originalPath.dirname(...args))
      vi.mocked(path.resolve).mockImplementation((...args) => originalPath.resolve(...args))
      vi.mocked(existsSync).mockImplementation(() => false)

      expect(() => pkgRoot()).to.throw('Could not find package.json to determine package root')
    })
  })
})
