const get = require('lodash/get')
const map = require('lodash/map')
const pick = require('lodash/pick')
const once = require('lodash/once')
const Promise = require('bluebird')
const browser = require('webextension-polyfill')
const { cookieMatches } = require('@packages/server/lib/automation/util')

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

const checkIfFirefox = async () => {
  if (!browser || !get(browser, 'runtime.getBrowserInfo')) {
    return false
  }

  const { name } = await browser.runtime.getBrowserInfo()

  return name === 'Firefox'
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

  const listenToOnBeforeHeaders = once(() => {
    // adds a header to the request to mark it as a request for the AUT frame
    // itself, so the proxy can utilize that for injection purposes
    browser.webRequest.onBeforeSendHeaders.addListener((details) => {
      if (
        // parentFrameId: 0 means the parent is the top-level, so if it isn't
        // 0, it's nested inside the AUT and can't be the AUT itself
        details.parentFrameId !== 0
        // is the spec frame, not the AUT
        || details.url.includes('__cypress')
      ) return

      return {
        requestHeaders: [
          ...details.requestHeaders,
          {
            name: 'X-Cypress-Is-AUT-Frame',
            value: 'true',
          },
        ],
      }
    }, { urls: ['<all_urls>'], types: ['sub_frame'] }, ['blocking', 'requestHeaders'])
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
      case 'add:cookies':
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
      case 'reset:browser:state':
        return invoke('resetBrowserState', id)
      case 'reset:browser:tabs:for:next:test':
        return invoke('resetBrowserTabsForNextTest', id)
      default:
        return fail(id, { message: `No handler registered for: '${msg}'` })
    }
  })

  ws.on('automation:config', async (config) => {
    const isFirefox = await checkIfFirefox()

    listenToCookieChanges()
    // Non-Firefox browsers use CDP for these instead
    if (isFirefox) {
      listenToDownloads()
      listenToOnBeforeHeaders()
    }
  })

  ws.on('connect', () => {
    ws.emit('automation:client:connected')
  })

  return ws
}

const setOneCookie = (props) => {
  // only get the url if its not already set
  if (props.url == null) {
    props.url = util.getCookieUrl(props)
  }

  if (props.hostOnly) {
    // If the hostOnly prop is available, delete the domain.
    // This will wind up setting a hostOnly cookie based on the calculated cookieURL above.
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

    // Firefox's filtering doesn't match the behavior we want, so we do it
    // ourselves. for example, getting { domain: example.com } cookies will
    // return cookies for example.com and all subdomains, whereas we want an
    // exact match for only "example.com".
    return Promise.try(() => {
      return browser.cookies.getAll({ url: filter.url })
      .then((cookies) => {
        return cookies.filter((cookie) => {
          return cookieMatches(cookie, filter)
        })
      })
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
    return this.getCookie(filter)
    .then((cookie) => {
      if (!cookie) return null

      return clearOneCookie(cookie)
    })
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

  resetBrowserState (fn) {
    // We remove browser data. Firefox goes through this path, while chrome goes through cdp automation
    // Note that firefox does not support fileSystems or serverBoundCertificates
    // (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browsingData/DataTypeSet).
    return browser.browsingData.remove({}, { cache: true, cookies: true, downloads: true, formData: true, history: true, indexedDB: true, localStorage: true, passwords: true, pluginData: true, serviceWorkers: true }).then(fn)
  },

  resetBrowserTabsForNextTest (fn) {
    return Promise.try(() => {
      return browser.tabs.create({ url: 'about:blank' })
    }).then(() => {
      return browser.windows.getCurrent({ populate: true })
    }).then((windowInfo) => {
      return browser.tabs.remove(windowInfo.tabs.map((tab) => tab.id))
    }).then(fn)
  },

  query (data) {
    const code = `var s; (s = document.getElementById('${data.element}')) && s.textContent`

    const queryTab = (tab) => {
      return Promise.try(() => {
        return browser.tabs.executeScript(tab.id, { code })
      }).then((results) => {
        if (!results || (results[0] !== data.randomString)) {
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
