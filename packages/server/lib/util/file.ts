import _ from 'lodash'
import os from 'os'
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
// A lock is held only for one small JSON read, write or remove, which takes
// milliseconds. A lock file this old was left by a process that died while
// holding it, so it is safe to take over. The margin is generous because taking
// over a live holder's lock is the corruption the lock exists to prevent, while
// waiting slightly longer on a dead one only fails reads for a few more seconds.
const LOCK_STALE = 10000

type Unlock = () => Promise<void>

function lockTimeoutError (filePath: string, lockFilePath: string, cause: Error) {
  return new Error(`Could not access ${filePath} because another Cypress process appears to hold its lock (${lockFilePath}). The file was left unchanged.`, { cause })
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
      return fn({
        get: this._get.bind(this, true),
        set: this._set.bind(this, true),
      })
    })
  }

  get (...args) {
    debugVerbose('get values from %s', this.path)

    return this._get(false, ...(args as [string, any]))
  }

  set (...args) {
    debugVerbose('set values in %s', this.path)

    return this._set(false, ...(args as [string, any]))
  }

  remove () {
    debugVerbose('remove %s', this.path)
    this._cache = {}

    return this._withLock(() => {
      return fs.removeAsync(this.path)
    })
    .finally(() => {
      debugVerbose('remove succeeded or failed for %s', this.path)
    })
  }

  _get (inTransaction, key, defaultValue) {
    const get = inTransaction ?
      this._getContents()
      :
      this._addToQueue(() => {
        return this._getContents()
      })

    return get
    .then((contents) => {
      if ((key == null)) {
        return contents
      }

      const value = _.get(contents, key)

      return value === undefined ? _.clone(defaultValue) : value
    })
  }

  _getContents () {
    // read from disk on first call, but resolve cache for any subsequent
    // calls within the DEBOUNCE_LIMIT
    // once the DEBOUNCE_LIMIT passes, read from disk again
    // on the next call
    if ((Date.now() - this._lastRead) > DEBOUNCE_LIMIT) {
      this._lastRead = Date.now()

      return this._read()
      .tap((contents) => {
        this._cache = contents
      })
      .tapCatch(() => {
        // the cache no longer reflects the file, so the next call must read it again
        this._lastRead = 0
      })
    }

    return Promise.resolve(this._cache)
  }

  _read () {
    return this._withLock(() => {
      debugVerbose('read %s', this.path)

      return fs.readJsonAsync(this.path, 'utf8')
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
    })
    .finally(() => {
      debugVerbose('read succeeded or failed for %s', this.path)
    })
  }

  _set (inTransaction, key, value) {
    if (!_.isString(key) && !_.isPlainObject(key)) {
      const type = _.isArray(key) ? 'array' : (typeof key)

      throw new TypeError(`Expected \`key\` to be of type \`string\` or \`object\`, got \`${type}\``)
    }

    let valueObject = key

    if (_.isString(key)) {
      const tmp = {}

      tmp[key] = value

      valueObject = tmp
    }

    if (inTransaction) {
      return this._setContents(valueObject)
    }

    return this._addToQueue(() => {
      return this._setContents(valueObject)
    })
  }

  _setContents (valueObject) {
    return this._getContents()
    .then((contents) => {
      _.each(valueObject, (value, key) => {
        _.set(contents, key, value)
      })

      this._cache = contents

      return this._write()
    })
    .tapCatch(() => {
      this._lastRead = 0
    })
  }

  _addToQueue (operation) {
    // queues operations so they occur serially as invoked
    return Promise.try(() => {
      return this._queue.add(operation)
    })
  }

  _write () {
    return this._withLock(() => {
      debugVerbose('write %s', this.path)

      // @ts-expect-error
      return fs.outputJsonAsync(this.path, this._cache, { spaces: 2 })
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
