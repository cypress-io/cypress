/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const browser = require('webextension-polyfill');
const map     = require("lodash/map");
const pick    = require("lodash/pick");
const once    = require("lodash/once");
const Promise = require("bluebird");
const client  = require("./client");
const { startRecording } = require('./recording');
const { getCookieUrl } = require('../lib/util');

const COOKIE_PROPS = ['url', 'name', 'path', 'secure', 'domain'];
const GET_ALL_PROPS = COOKIE_PROPS.concat(['session', 'storeId']);
const SET_PROPS = COOKIE_PROPS.concat(['value', 'httpOnly', 'expirationDate']);

const httpRe = /^http/;

const firstOrNull = cookies =>
  //# normalize into null when empty array
  cookies[0] != null ? cookies[0] : null
;

const connect = function(host, path, onScreencastFrame) {
  const listenToCookieChanges = once(() =>
    browser.cookies.onChanged.addListener(function(info) {
      if (info.cause !== "overwrite") {
        return ws.emit("automation:push:request", "change:cookie", info);
      }
    })
  );

  const fail = (id, err) =>
    ws.emit("automation:response", id, {
      __error: err.message,
      __stack: err.stack,
      __name:  err.name
    })
  ;

  const invoke = function(method, id, ...args) {
    const respond = data => ws.emit("automation:response", id, {response: data});

    return Promise.try(() => automation[method].apply(automation, args.concat(respond))).catch(err => fail(id, err));
  };

  var ws = client.connect(host, path);

  ws.on("automation:request", function(id, msg, data) {
    switch (msg) {
      case "get:cookies":
        return invoke("getCookies", id, data);
      case "get:cookie":
        return invoke("getCookie", id, data);
      case "set:cookie":
        return invoke("setCookie", id, data);
      case "clear:cookies":
        return invoke("clearCookies", id, data);
      case "clear:cookie":
        return invoke("clearCookie", id, data);
      case "is:automation:client:connected":
        return invoke("verify", id, data);
      case "focus:browser:window":
        return invoke("focus", id);
      case "take:screenshot":
        return invoke("takeScreenshot", id);
      default:
        return fail(id, {message: `No handler registered for: '${msg}'`});
    }
  });

  ws.on("connect", function() {
    listenToCookieChanges();

    return ws.emit("automation:client:connected");
  });

  // if onScreencastFrame
  //   startRecording (data) ->
  //     ws.emit('capture:extension:video:frame', data)

  return ws;
};

var automation = {
  connect,

  getUrl: getCookieUrl,

  clear(filter = {}) {
    const clear = cookie => {
      const url = this.getUrl(cookie);
      const props = {url, name: cookie.name};

      const throwError = function(err) {
        throw (err != null ? err : new Error(`Removing cookie failed for: ${JSON.stringify(props)}`));
      };

      return Promise.try(() => browser.cookies.remove(props)).then(function(details) {
        if (details) {
          return cookie;
        } else {
          return throwError();
        }}).catch(throwError);
    };

    return this.getAll(filter)
    .map(clear);
  },

  getAll(filter = {}) {
    filter = pick(filter, GET_ALL_PROPS);
    return Promise.try(() => browser.cookies.getAll(filter));
  },

  getCookies(filter, fn) {
    return this.getAll(filter)
    .then(fn);
  },

  getCookie(filter, fn) {
    return this.getAll(filter)
    .then(firstOrNull)
    .then(fn);
  },

  setCookie(props = {}, fn) {
    //# only get the url if its not already set
    if (props.url == null) { props.url = this.getUrl(props); }
    if (props.hostOnly) {
      delete props.domain;
    }
    if (props.domain === 'localhost') {
      delete props.domain;
    }
    props = pick(props, SET_PROPS);
    return Promise.try(() => browser.cookies.set(props)).then(details =>
      //# the cookie callback could be null such as the
      //# case when expirationDate is before now
      fn(details || null)
    );
  },

  clearCookie(filter, fn) {
    return this.clear(filter)
    .then(firstOrNull)
    .then(fn);
  },

  clearCookies(filter, fn) {
    return this.clear(filter)
    .then(fn);
  },

  focus(fn) {
    //# lets just make this simple and whatever is the current
    //# window bring that into focus
    //#
    //# TODO: if we REALLY want to be nice its possible we can
    //# figure out the exact window that's running Cypress but
    //# that's too much work with too little value at the moment
    return Promise.try(() => browser.windows.getCurrent()).then(window => browser.windows.update(window.id, {focused: true})).then(fn);
  },

  query(data) {
    const code = `var s; (s = document.getElementById('${data.element}')) && s.textContent`;

    const queryTab = tab =>
      Promise.try(() => browser.tabs.executeScript(tab.id, {code})).then(function(results) {
        if (!results || (results[0] !== data.string)) {
          throw new Error("Executed script did not return result");
        }
      })
    ;

    return Promise.try(() => browser.tabs.query({windowType: "normal"})).filter(tab =>
      //# the tab's url must begin with
      //# http or https so that we filter out
      //# about:blank and chrome:// urls
      //# which will throw errors!
      httpRe.test(tab.url)).then(tabs =>
      //# generate array of promises
      map(tabs, queryTab)).any();
  },

  verify(data, fn) {
    return this.query(data)
    .then(fn);
  },

  lastFocusedWindow() {
    return Promise.try(() => browser.windows.getLastFocused());
  },

  takeScreenshot(fn) {
    return this.lastFocusedWindow()
    .then(win => browser.tabs.captureVisibleTab(win.id, {format: "png"}))
    .then(fn);
  }
    
};

module.exports = automation;
