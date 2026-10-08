import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import os from 'os'
import path from 'path'
import Promise from 'bluebird'
import lockFileModule from 'lockfile'
import { fs } from '../../../lib/util/fs'
import * as env from '../../../lib/util/env'
import { GracefulExit } from '../../../lib/util/graceful-exit'
import { File as FileUtil } from '../../../lib/util/file'

const lockFile = Promise.promisifyAll(lockFileModule)

/** Introspect GracefulExit for regressions on File teardown registration (not public API). */
function countUnlockLockfileSteps (): number {
  const singleton = (GracefulExit as unknown as { singleton: { steps: Map<string, { name: string }> } }).singleton

  return [...singleton.steps.values()].filter((s) => s.name === 'unlock lockfile').length
}

describe('lib/util/file', () => {
  let dir: string
  let filePath: string
  let fileUtil: any

  beforeEach(() => {
    dir = path.join(os.tmpdir(), 'cypress', 'file_spec')
    filePath = path.join(dir, 'file.json')

    return fs.removeAsync(dir).catch(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ignore error if directory didn't exist in the first place
  it('throws if path is not specified', () => {
    expect(() => {
      return new FileUtil()
    }).toThrow('Must specify path to file when creating new FileUtil()')
  })

  it('unlocks file on exit', () => {
    const unlockSpy = vi.spyOn(lockFile, 'unlockSync')
    let teardownStep: () => Promise<void>
    const addStepStub = vi.spyOn(GracefulExit, 'addStep').mockImplementation((fn) => {
      teardownStep = fn as () => Promise<void>

      return 'test-step'
    })

    new FileUtil({ path: filePath })

    return teardownStep!().then(() => {
      expect(lockFile.unlockSync).toHaveBeenCalled()
    }).finally(() => {
      addStepStub.mockRestore()
      unlockSpy.mockRestore()
    })
  })

  it('does not leave orphaned GracefulExit unlock steps when ephemeral File instances are discarded', () => {
    const before = countUnlockLockfileSteps()

    for (let i = 0; i < 3; i++) {
      new FileUtil({ path: path.join(dir, `ephemeral-${i}.json`) })
    }

    // Each File should remove its GracefulExit step when the instance is no longer needed, so
    // unreferenced instances must not accumulate unlock handlers (see lib/util/file.ts).
    expect(
      countUnlockLockfileSteps(),
      'ephemeral File instances must not leave GracefulExit unlock steps registered after they are discarded',
    ).toBe(before)
  })

  describe('#transaction', () => {
    beforeEach(() => {
      fileUtil = new FileUtil({ path: filePath })
    })

    it('ensures returned promise completely resolves before moving on with queue', () => {
      return Promise.all([
        fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('foo'))
          })
        }),

        fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('bar'))
          })
        }),

        fileUtil.transaction((tx) => {
          return tx.get('items', []).then((items) => {
            return tx.set('items', items.concat('baz'))
          })
        }),
      ])
      .then(() => {
        return fileUtil.transaction((tx) => {
          return tx.get('items').then((items) => {
            expect(items).toStrictEqual(['foo', 'bar', 'baz'])
          })
        })
      })
    })
  })

  describe('#get', () => {
    beforeEach(() => {
      fileUtil = new FileUtil({ path: filePath })
    })

    it('resolves entire object if given no key', () => {
      return fileUtil.get().then((contents) => {
        expect(contents).toStrictEqual({})
      })
    })

    it('resolves value for key when one is set', () => {
      return fileUtil.set('foo', 'bar')
      .then(() => {
        return fileUtil.get('foo')
      }).then((value) => {
        expect(value).toBe('bar')
      })
    })

    it('resolves value for path when one is set', () => {
      return fileUtil.set('foo.baz', 'bar')
      .then(() => {
        return fileUtil.get('foo.baz')
      }).then((value) => {
        expect(value).toBe('bar')
      })
    })

    it('resolves default value if given key is undefined', () => {
      return fileUtil.get('foo', 'default').then((value) => {
        expect(value).toBe('default')
      })
    })

    it('resolves undefined if value is undefined', () => {
      return fileUtil.get('foo').then((value) => {
        expect(value).toBeUndefined()
      })
    })

    it('resolves null if value is null', () => {
      return fileUtil.set('foo', null)
      .then(() => {
        return fileUtil.get('foo')
      }).then((value) => {
        expect(value).toBeNull()
      })
    })

    it('resolves empty object when contents file does not exist', () => {
      return fs.removeAsync(dir)
      .then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({})
      })
    })

    it('resolves empty object when contents file is empty', () => {
      return fs.ensureDirAsync(dir)
      .then(() => {
        return fs.writeFileAsync(path.join(dir, 'file.json'), '')
      }).then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({})
      })
    })

    it('resolves empty object when it can\'t get lock on file on initial read', () => {
      return fs.ensureDirAsync(dir)
      .then(() => {
        return fs.writeJsonAsync(filePath, { foo: 'bar' })
      }).then(() => {
        vi.spyOn(lockFile, 'lockAsync').mockRejectedValue({ name: '', message: '', code: 'EEXIST' })

        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({})
      })
    })

    it('resolves cached contents when it can\'t get lock on file after an initial read', () => {
      return fileUtil.set('foo', 'bar')
      .then(() => {
        vi.spyOn(lockFile, 'lockAsync').mockRejectedValue({ name: '', message: '', code: 'EEXIST' })

        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({ foo: 'bar' })
      })
    })

    it('resolves empty object when contents file has invalid json', () => {
      return fs.ensureDirAsync(dir)
      .then(() => {
        return fs.writeFileAsync(path.join(dir, 'file.json'), '{')
      }).then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({})
      })
    })

    it('debounces reading from disk', () => {
      vi.spyOn(fs, 'readJsonAsync').mockResolvedValue({})

      return Promise.all([
        fileUtil.get(),
        fileUtil.get(),
        fileUtil.get(),
      ])
      .then(() => {
        expect(fs.readJsonAsync).toHaveBeenCalledOnce()
      })
    })

    it('locks file while reading', () => {
      vi.spyOn(lockFile, 'lockAsync')

      return fileUtil.get().then(() => {
        expect(lockFile.lockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file when finished reading', () => {
      vi.spyOn(lockFile, 'unlockAsync')

      return fileUtil.get().then(() => {
        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file even if reading fails', () => {
      vi.spyOn(lockFile, 'unlockAsync')
      vi.spyOn(fs, 'readJsonAsync').mockRejectedValue(new Error('fail!'))

      return fileUtil.get().catch(() => {
        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })

    it('times out and carries on if unlocking times out', () => {
      vi.spyOn(lockFile, 'lockAsync').mockResolvedValue(undefined)
      vi.spyOn(lockFile, 'unlockAsync').mockImplementation(() => {
        return Promise.delay(1e9)
      })

      vi.spyOn(fs, 'readJsonAsync').mockResolvedValue({})
      vi.spyOn(env, 'get').mockImplementation((key) => (key === 'FILE_UNLOCK_TIMEOUT' ? 100 : undefined) as any)

      return fileUtil.get()
    })
  })

  describe('#set', () => {
    beforeEach(() => {
      fileUtil = new FileUtil({ path: filePath })
    })

    it('throws if 1st argument is not a string or plain object', () => {
      expect(() => {
        return fileUtil.set(1)
      }).toThrow('Expected `key` to be of type `string` or `object`, got `number`')

      expect(() => {
        return fileUtil.set([])
      }).toThrow('Expected `key` to be of type `string` or `object`, got `array`')
    })

    it('sets value for given key', () => {
      return fileUtil.set('foo', 'bar')
      .then(() => {
        return fileUtil.get('foo')
      }).then((value) => {
        expect(value).toBe('bar')
      })
    })

    it('sets value for given path', () => {
      return fileUtil.set('foo.baz', 'bar')
      .then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({
          foo: {
            baz: 'bar',
          },
        })
      })
    })

    it('sets values for object', () => {
      return fileUtil.set({
        foo: 'bar',
        baz: {
          qux: 'lolz',
        },
      })
      .then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({
          foo: 'bar',
          baz: {
            qux: 'lolz',
          },
        })
      })
    })

    it('leaves existing values alone', () => {
      return fileUtil.set('foo', 'bar')
      .then(() => {
        return fileUtil.set('baz', 'qux')
      }).then(() => {
        return fileUtil.get()
      }).then((contents) => {
        expect(contents).toStrictEqual({
          foo: 'bar',
          baz: 'qux',
        })
      })
    })

    it('updates file on disk', () => {
      return fileUtil.set('foo', 'bar')
      .then(() => {
        return fs.readFileAsync(path.join(dir, 'file.json'), 'utf8')
      }).then((contents) => {
        expect(JSON.parse(contents)).toStrictEqual({ foo: 'bar' })
      })
    })

    it('locks file while writing', () => {
      vi.spyOn(lockFile, 'lockAsync')

      return fileUtil.set('foo', 'bar').then(() => {
        expect(lockFile.lockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file when finished writing', () => {
      vi.spyOn(lockFile, 'unlockAsync')

      return fileUtil.set('foo', 'bar').then(() => {
        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file even if writing fails', () => {
      vi.spyOn(lockFile, 'unlockAsync')
      vi.spyOn(fs, 'outputJsonAsync').mockRejectedValue(new Error('fail!'))

      return fileUtil.set('foo', 'bar').catch(() => {
        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })
  })

  describe('#remove', () => {
    beforeEach(() => {
      fileUtil = new FileUtil({ path: filePath })
    })

    it('removes the file', () => {
      return fileUtil.remove()
      .then(() => {
        return fs.statAsync(filePath)
      }).catch(() => {})
    })

    it('locks file while removing', () => {
      vi.spyOn(lockFile, 'lockAsync')

      return fileUtil.remove().then(() => {
        expect(lockFile.lockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file when finished removing', () => {
      vi.spyOn(lockFile, 'unlockAsync')

      return fileUtil.remove()
      .then(() => {
        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })

    it('unlocks file even if removing fails', () => {
      vi.spyOn(lockFile, 'unlockAsync')
      vi.spyOn(fs, 'removeAsync').mockRejectedValue(new Error('fail!'))

      return fileUtil.remove()
      .then(() => {
        throw new Error('should have caught!')
      }).catch((err) => {
        expect(err.message).toBe('fail!')

        expect(lockFile.unlockAsync).toHaveBeenCalled()
      })
    })
  })
})
