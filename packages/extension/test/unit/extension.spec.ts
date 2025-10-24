import { describe, it, expect, beforeEach, vi } from 'vitest'
import { exec } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import * as extension from '../../lib/index'

vi.mock('../../lib/index', async (importActual) => {
  const actual = await importActual()

  return {
    // @ts-expect-error
    ...actual,
    getPathToExtension: vi.fn(),
  }
})

const cwd = process.cwd()

describe('Extension', () => {
  describe('.getPathToExtension', () => {
    beforeEach(async () => {
      const { getPathToExtension } = await vi.importActual<typeof import('../../lib/index')>('../../lib/index')

      // use the actual implementation for these tests
      vi.mocked(extension.getPathToExtension).mockImplementation(getPathToExtension)
    })

    it('returns path to app-dist/v2', () => {
      const result = extension.getPathToExtension()
      const expected = path.join(cwd, 'app-dist', 'v2')

      expect(path.normalize(result)).toEqual(path.normalize(expected))
    })

    it('returns path to files in app-dist/v2', () => {
      const result = extension.getPathToExtension('background.js')
      const expected = path.join(cwd, '/app-dist/v2/background.js')

      expect(path.normalize(result)).toEqual(path.normalize(expected))
    })
  })

  describe('.getPathToV3Extension', () => {
    it('returns path to app-dist/v3', () => {
      const result = extension.getPathToV3Extension()
      const expected = path.join(cwd, 'app-dist', 'v3')

      expect(path.normalize(result)).toEqual(path.normalize(expected))
    })
  })

  describe('.getPathToTheme', () => {
    it('returns path to theme', () => {
      const result = extension.getPathToTheme()
      const expected = path.join(cwd, 'theme')

      expect(path.normalize(result)).toEqual(path.normalize(expected))
    })
  })

  describe('.getPathToRoot', () => {
    it('returns path to root', () => {
      expect(extension.getPathToRoot()).toEqual(cwd)
    })
  })

  describe('.setHostAndPath', () => {
    let src: string

    beforeEach(function () {
      src = path.join(cwd, 'test', 'helpers', 'background.js')

      vi.mocked(extension.getPathToExtension).mockImplementation((file) => {
        if (file === 'background.js') {
          return src
        }

        throw new Error(`Unexpected file: ${file}`)
      })
    })

    it('does not mutate background.js', async () => {
      const str = await fs.readFile(src, 'utf8')

      await extension.setHostAndPath('http://dev.local:8080', '/__foo')

      const str2 = await fs.readFile(src, 'utf8')

      expect(str).toEqual(str2)
    })
  })

  describe('manifest', () => {
    it('has a key that resolves to the static extension ID', async () => {
      const manifest = await fs.readJson(path.join(cwd, 'app/v2/manifest.json'))
      const cmd = `echo \"${manifest.key}\" | openssl base64 -d -A | shasum -a 256 | head -c32 | tr 0-9a-f a-p`

      const stdout = await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout) => {
          if (error) {
            reject(error)
          }

          resolve(stdout)
        })
      })

      expect(stdout).toEqual('caljajdfkjjjdehjdoimjkkakekklcck')
    })
  })
})
