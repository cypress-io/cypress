import _ from 'lodash'
import os from 'os'
import md5 from 'md5'
import path from 'path'
import debugModule from 'debug'
import Promise from 'bluebird'
import lockFileModule from 'lockfile'
import { fs } from './fs'
import * as env from './env'
import exit from './exit'
import pQueue from 'p-queue'
const lockFile = Promise.promisifyAll(lockFileModule)

const debugVerbose = debugModule('cypress-verbose:server:util:file')

const DEBOUNCE_LIMIT = 1000
const LOCK_TIMEOUT = 2000

function getUid () {
  try {
    // @ts-expect-error - process.geteuid is defined
    return process.geteuid()
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

    exit.ensure(() => {
      return lockFile.unlockSync(this._lockFilePath)
    })
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

    return this._lock()
    .then(() => {
      return fs.removeAsync(this.path)
    })
    .finally(() => {
      debugVerbose('remove succeeded or failed for %s', this.path)

      return this._unlock()
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
    }

    return Promise.resolve(this._cache)
  }

  _read () {
    return this._lock()
    .then(() => {
      debugVerbose('read %s', this.path)

      // @ts-expect-error
      return fs.readJsonAsync(this.path, 'utf8')
    })
    .catch((err) => {
      // default to {} in certain cases, otherwise bubble up error
      if (
        (err.code === 'ENOENT') || // file doesn't exist
        (err.code === 'EEXIST') || // file contains invalid JSON
        (err.name === 'SyntaxError') // can't get lock on file
      ) {
        return {}
      }

      throw err
    })
    .finally(() => {
      debugVerbose('read succeeded or failed for %s', this.path)

      return this._unlock()
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
  }

  _addToQueue (operation) {
    // queues operations so they occur serially as invoked
    return Promise.try(() => {
      return this._queue.add(operation)
    })
  }

  _write () {
    return this._lock()
    .then(() => {
      debugVerbose('write %s', this.path)

      // @ts-expect-error
      return fs.outputJsonAsync(this.path, this._cache, { spaces: 2 })
    })
    .finally(() => {
      debugVerbose('write succeeded or failed for %s', this.path)

      return this._unlock()
    })
  }

  _lock () {
    debugVerbose('attempt to get lock on %s', this.path)

    return fs
    // @ts-expect-error
    .ensureDirAsync(this._lockFileDir)
    .then(() => {
      // polls every 100ms up to 2000ms to obtain lock, otherwise rejects
      return lockFile.lockAsync(this._lockFilePath, { wait: LOCK_TIMEOUT })
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
