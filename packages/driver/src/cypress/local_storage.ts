const specialKeywords = /(debug)/

const $LocalStorage = {
  localStorage: null,
  remoteStorage: null,

  clear (keys) {
    // TODO: update this to $errUtils.throwErrByPath() if uncommented
    // throw new Error("Cypress.LocalStorage is missing local and remote storage references!") if not @localStorage or not @remoteStorage

    // make sure we always have an array here with all falsy values removed
    keys = ([] as any[]).concat(keys).filter(Boolean)

    const local = this.localStorage
    const remote = this.remoteStorage

    const storages = [local, remote].filter(Boolean)

    // we have to iterate over both our remoteIframes localStorage
    // and our window localStorage to remove items from it
    // due to a bug in IE that does not properly propagate
    // changes to an iframes localStorage
    storages.forEach((storage) => {
      Object.keys(storage)
      .filter((item) => !this._isSpecialKeyword(item))
      .forEach((item) => {
        if (keys.length) {
          this._ifItemMatchesAnyKey(item, keys, (key) => {
            return this._removeItem(storage, key)
          })

          return
        }

        this._removeItem(storage, item)
      })
    })
  },

  setStorages (local, remote) {
    this.localStorage = local
    this.remoteStorage = remote

    return this
  },

  unsetStorages () {
    this.localStorage = null
    this.remoteStorage = null

    return this
  },

  _removeItem (storage, item) {
    return storage.removeItem(item)
  },

  _isSpecialKeyword (item) {
    return specialKeywords.test(item)
  },

  _normalizeRegExpOrString (key) {
    if (key instanceof RegExp) {
      return key
    }

    if (typeof key === 'string') {
      return new RegExp(`^${key}$`)
    }

    return null
  },

  // if item matches by string or regex
  // any key in our keys then callback
  _ifItemMatchesAnyKey (item, keys, fn) {
    for (let key of keys) {
      const re = this._normalizeRegExpOrString(key)

      if (re?.test(item)) {
        return fn(item)
      }
    }
  },
}

export default $LocalStorage
