/* global chrome */
const map = require('lodash/map')
const pick = require('lodash/pick')
const once = require('lodash/once')
const Promise = require('bluebird')
const client = require('./client')

const COOKIE_PROPS = ['url', 'name', 'domain', 'path', 'secure', 'storeId']
const GET_ALL_PROPS = COOKIE_PROPS.concat(['session'])
const SET_PROPS = COOKIE_PROPS.concat(['value', 'httpOnly', 'expirationDate'])

const httpRe = /^http/

// normalize into null when empty array
const firstOrNull = (cookies) => {
  return cookies[0] != null ? cookies[0] : null
}

const connect = function (host, path) {
  const listenToCookieChanges = once(() => {
    return chrome.cookies.onChanged.addListener((info) => {
      if (info.cause !== 'overwrite') {
        return ws.emit('automation:push:request', 'change:cookie', info)
      }
    })
  })

  const fail = (id, err) => {
    return ws.emit('automation:response', id, {
      __error: err.message,
      __stack: err.stack,
      __name: err.name,
    })
  }

  const invoke = function (method, id, ...args) {
    const respond = (data) => {
      return ws.emit('automation:response', id, { response: data })
    }

    return Promise.try(() => {
      return automation[method].apply(automation, args.concat(respond))
    }).catch((err) => {
      return fail(id, err)
    })
  }

  const ws = client.connect(host, path)

  ws.on('automation:request', (id, msg, data) => {
    switch (msg) {
      case 'get:cookies':
        return invoke('getCookies', id, data)
      case 'get:cookie':
        return invoke('getCookie', id, data)
      case 'set:cookie':
        return invoke('setCookie', id, data)
      case 'clear:cookies':
        return invoke('clearCookies', id, data)
      case 'clear:cookie':
        return invoke('clearCookie', id, data)
      case 'is:automation:client:connected':
        return invoke('verify', id, data)
      case 'focus:browser:window':
        return invoke('focus', id)
      case 'take:screenshot':
        return invoke('takeScreenshot', id)
      default:
        return fail(id, { message: `No handler registered for: '${msg}'` })
    }
  })

  ws.on('connect', () => {
    listenToCookieChanges()

    return ws.emit('automation:client:connected')
  })

  return ws
}

const automation = {
  connect,

  getUrl (cookie = {}) {
    const prefix = cookie.secure ? 'https://' : 'http://'

    return prefix + cookie.domain + cookie.path
  },

  clear (filter = {}) {
    const clear = (cookie) => {
      return new Promise((resolve, reject) => {
        const url = this.getUrl(cookie)
        const props = { url, name: cookie.name }

        return chrome.cookies.remove(props, (details) => {
          if (details) {
            return resolve(cookie)
          }

          const err = new Error(`Removing cookie failed for: ${JSON.stringify(props)}`)

          return reject(chrome.runtime.lastError != null ? chrome.runtime.lastError : err)
        })
      })
    }

    return this.getAll(filter)
    .map(clear)
  },

  getAll (filter = {}) {
    filter = pick(filter, GET_ALL_PROPS)
    const get = () => {
      return new Promise((resolve) => {
        return chrome.cookies.getAll(filter, resolve)
      })
    }

    return get()
  },

  getCookies (filter, fn) {
    return this.getAll(filter)
    .then(fn)
  },

  getCookie (filter, fn) {
    return this.getAll(filter)
    .then(firstOrNull)
    .then(fn)
  },

  setCookie (props = {}, fn) {
    const set = () => {
      return new Promise((resolve, reject) => {
        // only get the url if its not already set
        if (props.url == null) {
          props.url = this.getUrl(props)
        }

        props = pick(props, SET_PROPS)

        return chrome.cookies.set(props, (details) => {
          if (details) {
            return resolve(details)
          }

          let err = chrome.runtime.lastError

          if (err) {
            return reject(err)
          }

          // the cookie callback could be null such as the
          // case when expirationDate is before now
          return resolve(null)
        })
      })
    }

    return set()
    .then(fn)
  },

  clearCookie (filter, fn) {
    return this.clear(filter)
    .then(firstOrNull)
    .then(fn)
  },

  clearCookies (filter, fn) {
    return this.clear(filter)
    .then(fn)
  },

  focus (fn) {
    // lets just make this simple and whatever is the current
    // window bring that into focus
    //
    // TODO: if we REALLY want to be nice its possible we can
    // figure out the exact window that's running Cypress but
    // that's too much work with too little value at the moment
    return chrome.windows.getCurrent((window) => {
      return chrome.windows.update(window.id, { focused: true }, () => {
        return fn()
      })
    })
  },

  query (data) {
    const code = `var s; (s = document.getElementById('${data.element}')) && s.textContent`

    const query = () => {
      return new Promise((resolve) => {
        return chrome.tabs.query({ windowType: 'normal' }, resolve)
      })
    }

    const queryTab = (tab) => {
      return new Promise((resolve, reject) => {
        return chrome.tabs.executeScript(tab.id, { code }, (result) => {
          if (result && (result[0] === data.string)) {
            return resolve()
          }

          return reject(new Error)
        })
      })
    }

    return query()
    .filter((tab) => {
      // the tab's url must begin with
      // http or https so that we filter out
      // about:blank and chrome:// urls
      // which will throw errors!
      return httpRe.test(tab.url)
    }).then((tabs) => {
      // generate array of promises
      return map(tabs, queryTab)
    }).any()
  },

  verify (data, fn) {
    return this.query(data)
    .then(fn)
  },

  lastFocusedWindow () {
    return new Promise((resolve) => {
      return chrome.windows.getLastFocused(resolve)
    })
  },

  takeScreenshot (fn) {
    return this.lastFocusedWindow()
    .then((win) => {
      return new Promise((resolve, reject) => {
        return chrome.tabs.captureVisibleTab(win.id, { format: 'png' }, (dataUrl) => {
          if (dataUrl) {
            return resolve(dataUrl)
          }

          return reject(chrome.runtime.lastError)
        })
      })
    }).then(fn)
  },
}

module.exports = automation
