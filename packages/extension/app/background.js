const map = require('lodash/map')
const pick = require('lodash/pick')
const once = require('lodash/once')
const Promise = require('bluebird')
const browser = require('webextension-polyfill')
const client = require('./client')
const util = require('../lib/util')

const COOKIE_PROPS = ['url', 'name', 'path', 'secure', 'domain']
const GET_ALL_PROPS = COOKIE_PROPS.concat(['session', 'storeId'])
// https://developer.chrome.com/extensions/cookies#method-set
const SET_PROPS = COOKIE_PROPS.concat(['value', 'httpOnly', 'expirationDate', 'sameSite'])

const httpRe = /^http/

// normalize into null when empty array
const firstOrNull = (cookies) => {
  return cookies[0] != null ? cookies[0] : null
}

const connect = function (host, path, extraOpts) {
  const listenToCookieChanges = once(() => {
    return browser.cookies.onChanged.addListener((info) => {
      if (info.cause !== 'overwrite') {
        return ws.emit('automation:push:request', 'change:cookie', info)
      }
    })
  })

  const listenToDownloads = once(() => {
    browser.downloads.onCreated.addListener((downloadItem) => {
      ws.emit('automation:push:request', 'create:download', {
        id: `${downloadItem.id}`,
        filePath: downloadItem.filename,
        mime: downloadItem.mime,
        url: downloadItem.url,
      })
    })

    browser.downloads.onChanged.addListener((downloadDelta) => {
      if ((downloadDelta.state || {}).current !== 'complete') return

      ws.emit('automation:push:request', 'complete:download', {
        id: `${downloadDelta.id}`,
      })
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

  const ws = client.connect(host, path, extraOpts)

  ws.on('automation:request', (id, msg, data) => {
    switch (msg) {
      case 'get:cookies':
        return invoke('getCookies', id, data)
      case 'get:cookie':
        return invoke('getCookie', id, data)
      case 'set:cookie':
        return invoke('setCookie', id, data)
      case 'set:cookies':
        return invoke('setCookies', id, data)
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
    listenToDownloads()

    return ws.emit('automation:client:connected')
  })

  return ws
}

const setOneCookie = (props) => {
  // only get the url if its not already set
  if (props.url == null) {
    props.url = util.getCookieUrl(props)
  }

  if (props.hostOnly) {
    delete props.domain
  }

  if (props.domain === 'localhost') {
    delete props.domain
  }

  props = pick(props, SET_PROPS)

  return Promise.try(() => {
    return browser.cookies.set(props)
  })
}

const clearOneCookie = (cookie = {}) => {
  const url = util.getCookieUrl(cookie)
  const props = { url, name: cookie.name }

  const throwError = function (err) {
    throw (err != null ? err : new Error(`Removing cookie failed for: ${JSON.stringify(props)}`))
  }

  return Promise.try(() => {
    if (!cookie.name) {
      throw new Error(`Removing cookie failed for: ${JSON.stringify(cookie)}. Cookie did not include a name`)
    }

    return browser.cookies.remove(props)
  }).then((details) => {
    return cookie
  }).catch(throwError)
}

const clearAllCookies = (cookies) => {
  return Promise.mapSeries(cookies, clearOneCookie)
}

const automation = {
  connect,

  getAll (filter = {}) {
    filter = pick(filter, GET_ALL_PROPS)

    return Promise.try(() => {
      return browser.cookies.getAll(filter)
    })
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
    return setOneCookie(props)
    .then(fn)
  },

  setCookies (propsArr = [], fn) {
    return Promise.mapSeries(propsArr, setOneCookie)
    .then(fn)
  },

  clearCookie (filter, fn) {
    return this.getAll(filter)
    .then(clearAllCookies)
    .then(firstOrNull)
    .then(fn)
  },

  clearCookies (cookies, fn) {
    return clearAllCookies(cookies)
    .then(fn)
  },

  focus (fn) {
    // lets just make this simple and whatever is the current
    // window bring that into focus
    //
    // TODO: if we REALLY want to be nice its possible we can
    // figure out the exact window that's running Cypress but
    // that's too much work with too little value at the moment
    return Promise.try(() => {
      return browser.windows.getCurrent()
    }).then((window) => {
      return browser.windows.update(window.id, { focused: true })
    }).then(fn)
  },

  query (data) {
    const code = `var s; (s = document.getElementById('${data.element}')) && s.textContent`

    const queryTab = (tab) => {
      return Promise.try(() => {
        return browser.tabs.executeScript(tab.id, { code })
      }).then((results) => {
        if (!results || (results[0] !== data.string)) {
          throw new Error('Executed script did not return result')
        }
      })
    }

    return Promise.try(() => {
      return browser.tabs.query({ windowType: 'normal' })
    }).filter((tab) => {
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
    return Promise.try(() => {
      return browser.windows.getLastFocused()
    })
  },

  takeScreenshot (fn) {
    return this.lastFocusedWindow()
    .then((win) => {
      return browser.tabs.captureVisibleTab(win.id, { format: 'png' })
    })
    .then(fn)
  },

}

module.exports = automation
