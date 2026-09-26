import _ from 'lodash'
import os from 'os'
import { promises as nodeFs } from 'fs'
import md5 from 'md5'
import path from 'path'
import debugModule from 'debug'
import Promise from 'bluebird'
import lockFileModule from 'lockfile'
import { fs } from './fs'
import * as env from './env'
import pQueue from 'p-queue'
import { GracefulExit } from './graceful-exit'

const lockFile = Promise.promisifyAll(lockFileModule)

const debugVerbose = debugModule('cypress-verbose:server:util:file')

const DEBOUNCE_LIMIT = 1000
const LOCK_TIMEOUT = 2000
// A lock is held only for one transaction on a small JSON file, which takes
// milliseconds. A lock file this old was left by a process that died while
// holding it, so it is safe to take over. The margin is generous because taking
// over a live holder's lock is the corruption the lock exists to prevent, while
// waiting slightly longer on a dead one only fails writes for a few more seconds.
const LOCK_STALE = 10000

type Unlock = () => Promise<void>

function lockTimeoutError (filePath: string, lockFilePath: string, cause: Error) {
  return new Error(`Could not update ${filePath} because another Cypress process appears to hold its lock (${lockFilePath}). The file was left unchanged.`, { cause })
}

function pick (contents: Record<string, any>, key?: string, defaultValue?: any) {
  if (key == null) {
    return contents
  }

  const value = _.get(contents, key)

  return value === undefined ? _.clone(defaultValue) : value
}

function toValueObject (key, value): Record<string, any> {
  if (_.isPlainObject(key)) {
    return key
  }

  if (!_.isString(key)) {
    const type = _.isArray(key) ? 'array' : (typeof key)

    throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got \`${type}\``)
  }

  return { [key]: value }
}

function getUid () {
  try {
    // eslint-disable-next-line no-restricted-properties
    return process.geteuid?.() ?? 1
  } catch (err) {
    // process.geteuid() can fail, return a constant
    // @see https://github.com/cypress-io/cypress/issues/17415
    return 1
  }
}

export class File {
  _lockFileDir!: string
  _lockFilePath!: string
  _queue!: pQueue
  _cache!: Record<string, any>
  _lastRead!: number
  path: string

  static noopFile = {
    get () {
      return Promise.resolve({})
    },
    set () {
      return Promise.resolve()
    },
    transaction () {},
    remove () {
      return Promise.resolve()
    },
  }

  constructor (options: { path?: string } = {}) {
    if (!options.path) {
      throw new Error('Must specify path to file when creating new FileUtil()')
    }

    this.path = options.path
    this.initialize()
  }

  initialize () {
    // If multiple users write to a specific directory is os.tmpdir, permission errors can arise.
    // Instead, we make a user specific directory with os.tmpdir.
    this._lockFileDir = path.join(os.tmpdir(), `cypress-${getUid()}`)
    this._lockFilePath = path.join(this._lockFileDir, `${md5(this.path)}.lock`)

    this._queue = new pQueue({ concurrency: 1 })

    this._cache = {}
    this._lastRead = 0
  }

  __resetForTest () {
    this._queue.clear()
    lockFile.unlockSync(this._lockFilePath)
    this.initialize()
  }

  transaction (fn) {
    debugVerbose('transaction for %s', this.path)

    return this._addToQueue(() => {
      return this._withLock(() => {
        // read the file once under the lock, not from the debounced cache, so
        // a write never merges into contents another process has since replaced
        let contents: Record<string, any> | undefined

        const load = () => {
          if (contents) {
            return Promise.resolve(contents)
          }

          return this._read().tap((read) => {
            contents = read
          })
        }

        return fn({
          get: (key?: string, defaultValue?: any) => {
            return load().then((current) => {
              return pick(current, key, defaultValue)
            })
          },
          set: (key, value?) => {
            const valueObject = toValueObject(key, value)

            return load().then((current) => {
              _.each(valueObject, (value, key) => {
                _.set(current, key, value)
              })

              return this._write(current)
            })
          },
        })
      })
    })
  }

  get (key?: string, defaultValue?: any) {
    debugVerbose('get values from %s', this.path)

    return this._addToQueue(() => {
      return this._getContents()
    })
    .then((contents) => {
      return pick(contents, key, defaultValue)
    })
  }

  set (key, value?) {
    debugVerbose('set values in %s', this.path)

    const valueObject = toValueObject(key, value)

    return this.transaction((tx) => {
      return tx.set(valueObject)
    })
  }

  remove () {
    debugVerbose('remove %s', this.path)

    return this._addToQueue(() => {
      return this._withLock(() => {
        return fs.removeAsync(this.path)
      })
    })
    .then(() => {
      this._cache = {}
    })
    .finally(() => {
      debugVerbose('remove succeeded or failed for %s', this.path)
    })
  }

  _getContents () {
    // read from disk on first call, but resolve cache for any subsequent
    // calls within the DEBOUNCE_LIMIT
    // once the DEBOUNCE_LIMIT passes, read from disk again
    // on the next call
    if ((Date.now() - this._lastRead) > DEBOUNCE_LIMIT) {
      return this._read()
      .tap((contents) => {
        this._cache = contents
        this._lastRead = Date.now()
      })
    }

    return Promise.resolve(this._cache)
  }

  // reads take no lock: writes replace the file with a rename, so a reader
  // sees either the old contents or the new, never a partial write
  _read () {
    debugVerbose('read %s', this.path)

    return Promise.resolve(fs.readJsonAsync(this.path, 'utf8'))
    .catch((err) => {
      // default to {} in certain cases, otherwise bubble up error
      if (
        (err.code === 'ENOENT') || // file doesn't exist
        (err.name === 'SyntaxError') // file contains invalid JSON
      ) {
        return {}
      }

      throw err
    })
  }

  _addToQueue<T> (operation: () => PromiseLike<T>): Promise<T> {
    // queues operations so they occur serially as invoked
    return Promise.try(() => {
      return this._queue.add(operation)
    })
  }

  // callers must hold the lock
  _write (contents: Record<string, any>) {
    debugVerbose('write %s', this.path)

    // the lock keeps other processes from writing, so a per-process name cannot collide
    const tmpPath = `${this.path}.${process.pid}.tmp`

    return Promise.try(async () => {
      await fs.ensureDir(path.dirname(this.path))
      // flush so a crash after the rename cannot leave an empty file behind
      await nodeFs.writeFile(tmpPath, `${JSON.stringify(contents, null, 2)}\n`, { flush: true })
      await fs.rename(tmpPath, this.path)
    })
    .tapCatch(() => {
      return fs.remove(tmpPath).catch(() => {})
    })
    .then(() => {
      this._cache = contents
      this._lastRead = Date.now()
    })
    .finally(() => {
      debugVerbose('write succeeded or failed for %s', this.path)
    })
  }

  // releases the lock only if this call acquired it, so a call that timed out
  // waiting can never delete a lock another process holds
  _withLock<T> (fn: () => T | PromiseLike<T>): Promise<T> {
    return this._lock().then((unlock) => {
      return Promise.try(fn).finally(unlock)
    })
  }

  _lock (): Promise<Unlock> {
    debugVerbose('attempt to get lock on %s', this.path)

    return fs
    .ensureDirAsync(this._lockFileDir)
    .then(() => {
      // polls every 100ms up to LOCK_TIMEOUT to obtain the lock, taking over a
      // lock file older than LOCK_STALE, otherwise rejects with EEXIST
      return lockFile.lockAsync(this._lockFilePath, { wait: LOCK_TIMEOUT, stale: LOCK_STALE })
    })
    .catch((err) => {
      if (err.code === 'EEXIST') {
        throw lockTimeoutError(this.path, this._lockFilePath, err)
      }

      throw err
    })
    .then(() => {
      let held = true

      const exitStepKey = GracefulExit.addStep(async () => {
        if (held) {
          held = false
          lockFile.unlockSync(this._lockFilePath)
        }
      }, 'unlock lockfile')

      return () => {
        GracefulExit.removeStep(exitStepKey)

        if (!held) {
          return Promise.resolve()
        }

        held = false

        return this._unlock()
      }
    })
    .finally(() => {
      return debugVerbose('getting lock succeeded or failed for %s', this.path)
    })
  }

  _unlock () {
    debugVerbose('attempt to unlock %s', this.path)

    return lockFile
    .unlockAsync(this._lockFilePath)
    .timeout(env.get('FILE_UNLOCK_TIMEOUT') || LOCK_TIMEOUT)
    .catch(Promise.TimeoutError, () => { // ignore timeouts
      debugVerbose(`unlock timeout error for %s`, this._lockFilePath)
    })
    .finally(() => {
      return debugVerbose('unlock succeeded or failed for %s', this.path)
    })
  }
}
