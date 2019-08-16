(function (a, b) {
  if ('function' === typeof define && define.amd) {
    define('webextension-polyfill', ['module'], b)
  } else if ('undefined' !== typeof exports) {
    b(module)
  } else {
    let c = { exports: {} }

    b(c), a.browser = c.exports
  }
})(this, function (a) {
  'use strict'; if ('undefined' === typeof browser) {
    a.exports = (() => {
      const c = { alarms: { clear: { minArgs: 0, maxArgs: 1 }, clearAll: { minArgs: 0, maxArgs: 0 }, get: { minArgs: 0, maxArgs: 1 }, getAll: { minArgs: 0, maxArgs: 0 } }, bookmarks: { create: { minArgs: 1, maxArgs: 1 }, export: { minArgs: 0, maxArgs: 0 }, get: { minArgs: 1, maxArgs: 1 }, getChildren: { minArgs: 1, maxArgs: 1 }, getRecent: { minArgs: 1, maxArgs: 1 }, getTree: { minArgs: 0, maxArgs: 0 }, getSubTree: { minArgs: 1, maxArgs: 1 }, import: { minArgs: 0, maxArgs: 0 }, move: { minArgs: 2, maxArgs: 2 }, remove: { minArgs: 1, maxArgs: 1 }, removeTree: { minArgs: 1, maxArgs: 1 }, search: { minArgs: 1, maxArgs: 1 }, update: { minArgs: 2, maxArgs: 2 } }, browserAction: { getBadgeBackgroundColor: { minArgs: 1, maxArgs: 1 }, getBadgeText: { minArgs: 1, maxArgs: 1 }, getPopup: { minArgs: 1, maxArgs: 1 }, getTitle: { minArgs: 1, maxArgs: 1 }, setIcon: { minArgs: 1, maxArgs: 1 } }, commands: { getAll: { minArgs: 0, maxArgs: 0 } }, contextMenus: { update: { minArgs: 2, maxArgs: 2 }, remove: { minArgs: 1, maxArgs: 1 }, removeAll: { minArgs: 0, maxArgs: 0 } }, cookies: { get: { minArgs: 1, maxArgs: 1 }, getAll: { minArgs: 1, maxArgs: 1 }, getAllCookieStores: { minArgs: 0, maxArgs: 0 }, remove: { minArgs: 1, maxArgs: 1 }, set: { minArgs: 1, maxArgs: 1 } }, devtools: { inspectedWindow: { eval: { minArgs: 1, maxArgs: 2 } }, panels: { create: { minArgs: 3, maxArgs: 3, singleCallbackArg: !0 } } }, downloads: { download: { minArgs: 1, maxArgs: 1 }, cancel: { minArgs: 1, maxArgs: 1 }, erase: { minArgs: 1, maxArgs: 1 }, getFileIcon: { minArgs: 1, maxArgs: 2 }, open: { minArgs: 1, maxArgs: 1 }, pause: { minArgs: 1, maxArgs: 1 }, removeFile: { minArgs: 1, maxArgs: 1 }, resume: { minArgs: 1, maxArgs: 1 }, search: { minArgs: 1, maxArgs: 1 }, show: { minArgs: 1, maxArgs: 1 } }, extension: { isAllowedFileSchemeAccess: { minArgs: 0, maxArgs: 0 }, isAllowedIncognitoAccess: { minArgs: 0, maxArgs: 0 } }, history: { addUrl: { minArgs: 1, maxArgs: 1 }, getVisits: { minArgs: 1, maxArgs: 1 }, deleteAll: { minArgs: 0, maxArgs: 0 }, deleteRange: { minArgs: 1, maxArgs: 1 }, deleteUrl: { minArgs: 1, maxArgs: 1 }, search: { minArgs: 1, maxArgs: 1 } }, i18n: { detectLanguage: { minArgs: 1, maxArgs: 1 }, getAcceptLanguages: { minArgs: 0, maxArgs: 0 } }, idle: { queryState: { minArgs: 1, maxArgs: 1 } }, management: { get: { minArgs: 1, maxArgs: 1 }, getAll: { minArgs: 0, maxArgs: 0 }, getSelf: { minArgs: 0, maxArgs: 0 }, uninstallSelf: { minArgs: 0, maxArgs: 1 } }, notifications: { clear: { minArgs: 1, maxArgs: 1 }, create: { minArgs: 1, maxArgs: 2 }, getAll: { minArgs: 0, maxArgs: 0 }, getPermissionLevel: { minArgs: 0, maxArgs: 0 }, update: { minArgs: 2, maxArgs: 2 } }, pageAction: { getPopup: { minArgs: 1, maxArgs: 1 }, getTitle: { minArgs: 1, maxArgs: 1 }, hide: { minArgs: 0, maxArgs: 0 }, setIcon: { minArgs: 1, maxArgs: 1 }, show: { minArgs: 0, maxArgs: 0 } }, runtime: { getBackgroundPage: { minArgs: 0, maxArgs: 0 }, getBrowserInfo: { minArgs: 0, maxArgs: 0 }, getPlatformInfo: { minArgs: 0, maxArgs: 0 }, openOptionsPage: { minArgs: 0, maxArgs: 0 }, requestUpdateCheck: { minArgs: 0, maxArgs: 0 }, sendMessage: { minArgs: 1, maxArgs: 3 }, sendNativeMessage: { minArgs: 2, maxArgs: 2 }, setUninstallURL: { minArgs: 1, maxArgs: 1 } }, storage: { local: { clear: { minArgs: 0, maxArgs: 0 }, get: { minArgs: 0, maxArgs: 1 }, getBytesInUse: { minArgs: 0, maxArgs: 1 }, remove: { minArgs: 1, maxArgs: 1 }, set: { minArgs: 1, maxArgs: 1 } }, managed: { get: { minArgs: 0, maxArgs: 1 }, getBytesInUse: { minArgs: 0, maxArgs: 1 } }, sync: { clear: { minArgs: 0, maxArgs: 0 }, get: { minArgs: 0, maxArgs: 1 }, getBytesInUse: { minArgs: 0, maxArgs: 1 }, remove: { minArgs: 1, maxArgs: 1 }, set: { minArgs: 1, maxArgs: 1 } } }, tabs: { create: { minArgs: 1, maxArgs: 1 }, captureVisibleTab: { minArgs: 0, maxArgs: 2 }, detectLanguage: { minArgs: 0, maxArgs: 1 }, duplicate: { minArgs: 1, maxArgs: 1 }, executeScript: { minArgs: 1, maxArgs: 2 }, get: { minArgs: 1, maxArgs: 1 }, getCurrent: { minArgs: 0, maxArgs: 0 }, getZoom: { minArgs: 0, maxArgs: 1 }, getZoomSettings: { minArgs: 0, maxArgs: 1 }, highlight: { minArgs: 1, maxArgs: 1 }, insertCSS: { minArgs: 1, maxArgs: 2 }, move: { minArgs: 2, maxArgs: 2 }, reload: { minArgs: 0, maxArgs: 2 }, remove: { minArgs: 1, maxArgs: 1 }, query: { minArgs: 1, maxArgs: 1 }, removeCSS: { minArgs: 1, maxArgs: 2 }, sendMessage: { minArgs: 2, maxArgs: 3 }, setZoom: { minArgs: 1, maxArgs: 2 }, setZoomSettings: { minArgs: 1, maxArgs: 2 }, update: { minArgs: 1, maxArgs: 2 } }, webNavigation: { getAllFrames: { minArgs: 1, maxArgs: 1 }, getFrame: { minArgs: 1, maxArgs: 1 } }, webRequest: { handlerBehaviorChanged: { minArgs: 0, maxArgs: 0 } }, windows: { create: { minArgs: 0, maxArgs: 1 }, get: { minArgs: 1, maxArgs: 2 }, getAll: { minArgs: 0, maxArgs: 1 }, getCurrent: { minArgs: 0, maxArgs: 1 }, getLastFocused: { minArgs: 0, maxArgs: 1 }, remove: { minArgs: 1, maxArgs: 1 }, update: { minArgs: 2, maxArgs: 2 } } }

      if (0 === Object.keys(c).length) throw new Error('api-metadata.json has not been included in browser-polyfill')

      class d extends WeakMap {
        constructor (o, p = void 0) {
          super(p), this.createItem = o
        }get (o) {
          return this.has(o) || this.set(o, this.createItem(o)), super.get(o)
        }
      } const e = (o) => {
        return o && 'object' === typeof o && 'function' === typeof o.then
      }; const f = (o, p) => {
        return (...q) => {
          chrome.runtime.lastError ? o.reject(chrome.runtime.lastError) : p.singleCallbackArg || 1 === q.length ? o.resolve(q[0]) : o.resolve(q)
        }
      }; const g = (o, p) => {
        const q = (r) => 1 == r ? 'argument' : 'arguments'

        return function (s, ...t) {
          if (t.length < p.minArgs) throw new Error(`Expected at least ${p.minArgs} ${q(p.minArgs)} for ${o}(), got ${t.length}`)

          if (t.length > p.maxArgs) throw new Error(`Expected at most ${p.maxArgs} ${q(p.maxArgs)} for ${o}(), got ${t.length}`)

          return new Promise((u, v) => {
            s[o](...t, f({ resolve: u, reject: v }, p))
          })
        }
      }; const h = (o, p, q) => {
        return new Proxy(p, { apply (r, s, t) {
          return q.call(s, o, ...t)
        } })
      }; let i = Function.call.bind(Object.prototype.hasOwnProperty); const j = (o, p = {}, q = {}) => {
        let r = Object.create(null); let s = { has (t, u) {
          return u in t || u in r
        }, get (t, u) {
          if (u in r) return r[u]

          if (u in t) {
            let w = t[u]

            if ('function' === typeof w) {
              if ('function' === typeof p[u]) {
                w = h(t, t[u], p[u])
              } else if (i(q, u)) {
                let x = g(u, q[u])

                w = h(t, t[u], x)
              } else {
                w = w.bind(t)
              }
            } else if ('object' === typeof w && null !== w && (i(p, u) || i(q, u))) {
              w = j(w, p[u], q[u])
            } else {
              return Object.defineProperty(r, u, { configurable: !0, enumerable: !0, get () {
                return t[u]
              }, set (x) {
                t[u] = x
              } }), w
            }

            return r[u] = w, w
          }
        }, set (t, u, v) {
          return u in r ? r[u] = v : t[u] = v, !0
        }, defineProperty (t, u, v) {
          return Reflect.defineProperty(r, u, v)
        }, deleteProperty (t, u) {
          return Reflect.deleteProperty(r, u)
        } }

        return new Proxy(o, s)
      }; const l = new d((o) => {
        return 'function' === typeof o ? function (q, r, s) {
          let t = o(q, r)

          return e(t) ? (t.then(s, (u) => {
            console.error(u), s(u)
          }), !0) : void (void 0 !== t && s(t))
        } : o
      }); const m = { runtime: { onMessage: ((o) => {
        return { addListener (p, q, ...r) {
          p.addListener(o.get(q), ...r)
        }, hasListener (p, q) {
          return p.hasListener(o.get(q))
        }, removeListener (p, q) {
          p.removeListener(o.get(q))
        } }
      })(l) } }; const n = Object.assign({}, chrome)

      return j(n, m, c)
    })()
  } else {
    a.exports = browser
  }
})
//# sourceMappingURL=browser-polyfill.min.js.map

// webextension-polyfill v.0.2.1 (https://github.com/mozilla/webextension-polyfill)

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
