import os from 'os'
import path from 'path'
import Bluebird from 'bluebird'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cache, render } from '../../lib/template_engine'
import { fs } from '../../lib/util/fs'

describe('lib/template_engine', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders and caches a template function', () => {
    vi.spyOn(fs, 'readFile')

    expect(cache).toStrictEqual({})

    const tmpPath = path.join(os.tmpdir(), 'index.html')

    return fs
    .writeFileAsync(tmpPath, 'My favorite template engine is {{favorite}}.')
    .then(() => {
      return Bluebird.fromCallback((cb) => {
        const opts = {
          favorite: 'Squirrelly',
        }

        return render(tmpPath, opts, cb)
      })
    })
    .then((str) => {
      expect(str).toBe('My favorite template engine is Squirrelly.')

      expect(fs.readFile).toHaveBeenCalledOnce()

      const compiledFn = cache[tmpPath]

      expect(compiledFn).toBeTypeOf('function')

      return Bluebird.fromCallback((cb) => {
        const opts = {
          favorite: 'Squirrelly2',
        }

        return render(tmpPath, opts, cb)
      })
      .then((str) => {
        expect(str).toBe('My favorite template engine is Squirrelly2.')

        expect(cache[tmpPath]).toBe(compiledFn)

        expect(fs.readFile).toHaveBeenCalledOnce()
      })
    })
  })
})
