const _ = require('lodash')
const os = require('os')
const md5 = require('md5')
const path = require('path')
const debug = require('debug')('cypress:server:file')
const Promise = require('bluebird')
const lockFile = Promise.promisifyAll(require('lockfile'))
const { fs } = require('./fs')
const env = require('./env')
const exit = require('./exit')
const { default: pQueue } = require('p-queue')

const DEBOUNCE_LIMIT = 1000
const LOCK_TIMEOUT = 2000

function getUid () {
  try {
    // eslint-disable-next-line no-restricted-properties
    return process.geteuid()
  } catch (err) {
    // process.geteuid() can fail, return a constant
    // @see https://github.com/cypress-io/cypress/issues/17415
    return 1
  }
}

class File {
  constructor (options = {}) {
    if (!options.path) {
      throw new Error('Must specify path to file when creating new FileUtil()')
    }

    this.path = options.path

    // If multiple users write to a specific directory is os.tmpdir, permission errors can arise.
    // Instead, we make a user specific directory with os.tmpdir.
    this._lockFileDir = path.join(os.tmpdir(), `cypress-${getUid()}`)
    this._lockFilePath = path.join(this._lockFileDir, `${md5(this.path)}.lock`)

    this._queue = new pQueue({ concurrency: 1 })

    this._cache = {}
    this._lastRead = 0

    exit.ensure(() => {
      return lockFile.unlockSync(this._lockFilePath)
    })
  }

  transaction (fn) {
    debug('transaction for %s', this.path)

    return this._addToQueue(() => {
      return fn({
        get: this._get.bind(this, true),
        set: this._set.bind(this, true),
      })
    })
  }

  get (...args) {
    debug('get values from %s', this.path)

    return this._get(false, ...args)
  }

  set (...args) {
    debug('set values in %s', this.path)

    return this._set(false, ...args)
  }

  remove () {
    debug('remove %s', this.path)
    this._cache = {}

    return this._lock()
    .then(() => {
      return fs.removeAsync(this.path)
    })
    .finally(() => {
      debug('remove succeeded or failed for %s', this.path)

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

      return value === undefined ? defaultValue : value
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
      debug('read %s', this.path)

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
      debug('read succeeded or failed for %s', this.path)

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
      debug('write %s', this.path)

      return fs.outputJsonAsync(this.path, this._cache, { spaces: 2 })
    })
    .finally(() => {
      debug('write succeeded or failed for %s', this.path)

      return this._unlock()
    })
  }

  _lock () {
    debug('attempt to get lock on %s', this.path)

    return fs
    .ensureDirAsync(this._lockFileDir)
    .then(() => {
      // polls every 100ms up to 2000ms to obtain lock, otherwise rejects
      return lockFile.lockAsync(this._lockFilePath, { wait: LOCK_TIMEOUT })
    })
    .finally(() => {
      return debug('getting lock succeeded or failed for %s', this.path)
    })
  }

  _unlock () {
    debug('attempt to unlock %s', this.path)

    return lockFile
    .unlockAsync(this._lockFilePath)
    .timeout(env.get('FILE_UNLOCK_TIMEOUT') || LOCK_TIMEOUT)
    .catch(Promise.TimeoutError, () => {}) // ignore timeouts
    .finally(() => {
      return debug('unlock succeeded or failed for %s', this.path)
    })
  }
}

File.noopFile = {
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

module.exports = File
