import { afterEach, describe, expect, it, vi } from 'vitest'
import os from 'os'
import osPath from 'ospath'
import path from 'path'
import Promise from 'bluebird'
import { fs } from '../../../lib/util/fs'
import * as AppData from '../../../lib/util/app_data'

// app_data.ts uses named `path` imports, so route them through the default export where vi.spyOn can reach them.
vi.mock('path', async (importOriginal) => {
  const actual = await importOriginal<typeof import('path') & { default: typeof import('path') }>()
  const defaultExport = { ...actual.default }
  const named = Object.fromEntries(Object.entries(defaultExport).map(([key, value]) => {
    return [key, typeof value === 'function' ? (...args: unknown[]) => defaultExport[key](...args) : value]
  }))

  return { ...named, default: defaultExport }
})

describe('lib/util/app_data', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('#toHashName', () => {
    const projectRoot = '/foo/bar'

    it('starts with folder name', () => {
      const hash = AppData.toHashName(projectRoot)

      expect(hash).toMatch(/^bar-/)
    })

    it('computed for given path', () => {
      const hash = AppData.toHashName(projectRoot)
      const expected = 'bar-1df481b1ec67d4d8bec721f521d4937d'

      expect(hash).toBe(expected)
    })

    it('does not handle empty project path', () => {
      const tryWithoutPath = () => {
        return AppData.toHashName()
      }

      expect(tryWithoutPath).toThrow('Missing project path')
    })
  })

  describe('#ensure', () => {
    it('does not create the symlink until the appData directory exists', async () => {
      let ensureDirCompleted = false
      let ensureDirCompletedAtSymlinkCall = null

      vi.spyOn(fs, 'removeAsync').mockResolvedValue(undefined)
      vi.spyOn(fs, 'ensureDirAsync').mockImplementation(() => {
        return Promise.delay(50).then(() => {
          ensureDirCompleted = true
        })
      })

      vi.spyOn(fs, 'ensureSymlinkAsync').mockImplementation(() => {
        ensureDirCompletedAtSymlinkCall = ensureDirCompleted

        return Promise.resolve()
      })

      await AppData.ensure()

      expect(ensureDirCompletedAtSymlinkCall, 'ensureSymlinkAsync was called before the appData directory existed').toBe(true)
    })
  })

  describe('#findCommonAncestor', () => {
    it('posix', () => {
      expect(AppData.findCommonAncestor('/a/b/c/d', '/a/b/c/d/')).toBe('/a/b/c/d')
      expect(AppData.findCommonAncestor('/a/b/c', '/a/x/y')).toBe('/a')
      expect(AppData.findCommonAncestor('/a/b/', '/a/b/')).toBe('/a/b/')
      expect(AppData.findCommonAncestor('/a', '/a/b/c')).toBe('/a')
      expect(AppData.findCommonAncestor('/a/b/c', '/a')).toBe('/a')
    })

    it('win32', () => {
      vi.spyOn(os, 'platform').mockReturnValue('win32')

      expect(AppData.findCommonAncestor('c:\\a\\b\\c\\d', 'c:\\a\\b\\c\\d\\')).toBe('c:\\a\\b\\c\\d')
      expect(AppData.findCommonAncestor('c:\\a\\b\\c', 'c:\\a\\x\\y')).toBe('c:\\a')
      expect(AppData.findCommonAncestor('c:\\a\\b\\', 'c:\\a\\b\\')).toBe('c:\\a\\b\\')
      expect(AppData.findCommonAncestor('c:\\a\\b\\', 'd:\\a\\b\\')).toBe('')
      expect(AppData.findCommonAncestor('c:\\a', 'c:\\a\\b\\c')).toBe('c:\\a')
      expect(AppData.findCommonAncestor('c:\\a\\b\\c', 'c:\\a')).toBe('c:\\a')
    })
  })

  describe('#getBundledFilePath', () => {
    it('provides an absolute path to the bundled file', () => {
      const projectRoot = '/foo/bar'
      const expectedPrefix = 'bar-1df481b1ec67d4d8bec721f521d4937d'
      const imagePath = '/img/123.png'
      const result = AppData.getBundledFilePath(projectRoot, imagePath)

      expect(result).toContain(expectedPrefix)
      expect(result).toContain(imagePath)
    })

    // @see https://github.com/cypress-io/cypress/issues/8599
    describe('issue #8599: can find a path to bundle preprocessor files that live outside the project directory', () => {
      it('on windows', () => {
        // mock / stub out path and os variables as if we were on Windows
        vi.spyOn(os, 'platform').mockReturnValue('win32')
        vi.spyOn(osPath, 'data').mockReturnValue(`C:\\Users\\foo\\AppData\\Roaming`)

        vi.spyOn(path, 'basename').mockImplementation((...args) => path.win32.basename(...args))
        vi.spyOn(path, 'dirname').mockImplementation((...args) => path.win32.dirname(...args))
        vi.spyOn(path, 'isAbsolute').mockImplementation((...args) => path.win32.isAbsolute(...args))
        vi.spyOn(path, 'join').mockImplementation((...args) => path.win32.join(...args))
        vi.spyOn(path, 'parse').mockImplementation((...args) => path.win32.parse(...args))
        vi.spyOn(path, 'normalize').mockImplementation((...args) => path.win32.normalize(...args))
        const filePathNotInProjectDirectory = `C:\\Users\\foo\\project\\support\\index.js`

        const projectRoot = `C:\\Users\\foo\\project\\nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).toBe(`C:\\Users\\foo\\AppData\\Roaming\\Cypress\\cy\\test\\projects\\nested-project-5ddfc54488859fd4a685e789cc5259c9\\bundles\\support\\index.js`)
      })

      it('on linux', () => {
        vi.spyOn(os, 'platform').mockReturnValue('linux')
        vi.spyOn(osPath, 'data').mockReturnValue(`/Users/foo/.cache`)

        const filePathNotInProjectDirectory = `/Users/foo/project/support/index.js`
        const projectRoot = `/Users/foo/project/nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).toBe(`/Users/foo/.cache/Cypress/cy/test/projects/nested-project-48bc0cf1ee4dff159065e8a5813d3c7f/bundles/support/index.js`)
      })

      it('on darwin/mac', () => {
        vi.spyOn(os, 'platform').mockReturnValue('linux')
        vi.spyOn(osPath, 'data').mockReturnValue(`/Users/foo/Library/Caches`)

        const filePathNotInProjectDirectory = `/Users/foo/project/support/index.js`
        const projectRoot = `/Users/foo/project/nested-project`

        const result = AppData.getBundledFilePath(projectRoot, filePathNotInProjectDirectory)

        expect(result).toBe(`/Users/foo/Library/Caches/Cypress/cy/test/projects/nested-project-48bc0cf1ee4dff159065e8a5813d3c7f/bundles/support/index.js`)
      })
    })
  })
})
