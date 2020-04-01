const _ = require('lodash')

const specialKeywords = /(debug)/

const $LocalStorage = {
  localStorage: null,
  remoteStorage: null,

  clear (keys) {
    // TODO: update this to $errUtils.throwErrByPath() if uncommented
    // throw new Error("Cypress.LocalStorage is missing local and remote storage references!") if not @localStorage or not @remoteStorage

    // make sure we always have an array here with all falsy values removed
    keys = _.compact([].concat(keys))

    const local = this.localStorage
    const remote = this.remoteStorage

    const storages = _.compact([local, remote])

    // we have to iterate over both our remoteIframes localStorage
    // and our window localStorage to remove items from it
    // due to a bug in IE that does not properly propogate
    // changes to an iframes localStorage
    return _.each(storages, (storage) => {
      return _
      .chain(storage)
      .keys()
      .reject(this._isSpecialKeyword)
      .each((item) => {
        if (keys.length) {
          return this._ifItemMatchesAnyKey(item, keys, (key) => {
            return this._removeItem(storage, key)
          })
        }

        return this._removeItem(storage, item)
      }).value()
    })
  },

  setStorages (local, remote) {
    this.localStorage = local
    this.remoteStorage = remote

    return this
  },

  unsetStorages () {
    this.localStorage = (this.remoteStorage = null)

    return this
  },

  _removeItem (storage, item) {
    return storage.removeItem(item)
  },

  _isSpecialKeyword (item) {
    return specialKeywords.test(item)
  },

  _normalizeRegExpOrString (key) {
    if (_.isRegExp(key)) {
      return key
    }

    if (_.isString(key)) {
      return new RegExp(`^${key}$`)
    }
  },

  // if item matches by string or regex
  // any key in our keys then callback
  _ifItemMatchesAnyKey (item, keys, fn) {
    for (let key of keys) {
      const re = this._normalizeRegExpOrString(key)

      if (re.test(item)) {
        return fn(item)
      }
    }
  },
}

module.exports = $LocalStorage
