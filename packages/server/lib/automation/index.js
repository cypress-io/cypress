/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _           = require("lodash");
const uuid        = require("uuid");
const Promise     = require("bluebird");
const Cookies     = require("./cookies");
const Screenshot  = require("./screenshot");

const assertValidOptions = (options, ...keys) =>
  _.each(keys, function(key) {
    if (!(key in options)) {
      throw new Error(`Automation requires the key: ${key}. You passed in:`, options);
    }
  })
;

module.exports = {
  create(cyNamespace, cookieNamespace, screenshotsFolder) {
    // assertValidOptions(options, "namespace", "cookie", "screenshotsFolder")

    const requests = {};

    let middleware = null;

    const reset = () =>
      middleware = {
        onPush: null,
        onBeforeRequest: null,
        onRequest: null,
        onResponse: null,
        onAfterResponse: null
      }
    ;

    //# set the middleware
    reset();

    const cookies    = Cookies(cyNamespace, cookieNamespace);
    const screenshot = Screenshot(screenshotsFolder);

    const get = fn => middleware[fn];

    const invokeAsync = (fn, ...args) =>
      Promise
      .try(function() {
        if (fn = get(fn)) {
          return fn.apply(null, args);
        }
      })
    ;

    const requestAutomationResponse = (message, data, fn) =>
      new Promise((resolve, reject) => {
        const id = uuid.v4();

        requests[id] = function(obj) {
          //# normalize the error from automation responses
          let e;
          if (e = obj.__error) {
            const err = new Error(e);
            err.name = obj.__name;
            err.stack = obj.__stack;
            return reject(err);
          } else {
            //# normalize the response
            return resolve(obj.response);
          }
        };

        //# callback onAutomate with the right args
        return fn(message, data, id);
      })
    ;

    const automationValve = (message, fn) =>
      function(msg, data) {
        //# enable us to omit message
        //# argument
        let onReq;
        if (!data) {
          data = msg;
          msg  = message;
        }

        //# if we have an onRequest function
        //# then just invoke that
        if ((onReq = get("onRequest"))) {
          return onReq(msg, data);
        } else {
          //# do the default
          return requestAutomationResponse(msg, data, fn);
        }
      }
    ;

    const normalize = (message, data, automate) =>
      Promise.try(function() {
        switch (message) {
          case "take:screenshot":
            return screenshot.capture(data, automate);
          case "get:cookies":
            return cookies.getCookies(data, automate);
          case "get:cookie":
            return cookies.getCookie(data, automate);
          case "set:cookie":
            return cookies.setCookie(data, automate);
          case "clear:cookies":
            return cookies.clearCookies(data, automate);
          case "clear:cookie":
            return cookies.clearCookie(data, automate);
          case "change:cookie":
            return cookies.changeCookie(data);
          default:
            return automate(data);
        }
      })
    ;

    return {
      _requests: requests,

      reset() {
        //# TODO: there's gotta be a better
        //# way to manage this state. i don't
        //# like automation being a singleton
        //# that's kept around between browsers
        //# opening and closing
        const { onPush } = middleware;

        reset();

        middleware.onPush = onPush;
        return middleware;
      },

      get() { return middleware; },

      use(middlewares = {}) {
        return _.extend(middleware, middlewares);
      },

      push(message, data) {
        return normalize(message, data)
        .then(function(data) {
          if (data) { return invokeAsync("onPush", message, data); }
        });
      },

      request(message, data, fn) {
        //# curry in the message + callback function
        //# for obtaining the external automation data
        const automate = automationValve(message, fn);

        //# enable us to tap into before making the request
        return invokeAsync("onBeforeRequest", message, data)
        .then(() => normalize(message, data, automate)).tap(resp => invokeAsync("onAfterResponse", message, data, resp));
      },

      response(id, resp) {
        let request;
        if (request = requests[id]) {
          delete request[id];
          return request(resp);
        }
      }
    };
  }
};
