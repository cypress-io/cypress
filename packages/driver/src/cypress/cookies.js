/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Cookies = require("js-cookie");

const $errUtils = require("./error_utils");

const reHttp = /^http/;

let isDebugging = false;
let isDebuggingVerbose = false;

const preserved = {};

const defaults = {
  whitelist: null
};

const $Cookies = function(namespace, domain) {
  const isNamespaced = name => _.startsWith(name, namespace);

  const isWhitelisted = function(cookie) {
    let w;
    if (w = defaults.whitelist) {
      switch (false) {
        case !_.isString(w):
          return cookie.name === w;
        case !_.isArray(w):
          return w.includes(cookie.name);
        case !_.isFunction(w):
          return w(cookie);
        case !_.isRegExp(w):
          return w.test(cookie.name);
        default:
          return false;
      }
    }
  };

  const removePreserved = function(name) {
    if (preserved[name]) {
      return delete preserved[name];
    }
  };

  const API = {
    debug(bool = true, options = {}) {
      _.defaults(options, {
        verbose: true
      });

      isDebugging = bool;
      return isDebuggingVerbose = bool && options.verbose;
    },

    log(message, cookie, removed) {
      if (!isDebugging) { return; }

      const m = removed ? "warn" : "info";

      const args = [_.truncate(message, { length: 50 })];

      if (isDebuggingVerbose) {
        args.push(cookie);
      }

      return console[m].apply(console, args);
    },

    getClearableCookies(cookies = []) {
      return _.filter(cookies, cookie => !isWhitelisted(cookie) && !removePreserved(cookie.name));
    },

    _set(name, value, options = {}) {
      //# dont set anything if we've been
      //# told to unload
      if (this.getCy("unload") === "true") { return; }

      _.defaults(options, {
        path: "/"
      });

      return Cookies.set(name, value, options);
    },

    _get(name) {
      return Cookies.get(name);
    },

    setCy(name, value, options = {}) {
      _.defaults(options, {
        domain
      });

      return this._set(`${namespace}.${name}`, value, options);
    },

    getCy(name) {
      return this._get(`${namespace}.${name}`);
    },

    preserveOnce(...keys) {
      return _.each(keys, key => preserved[key] = true);
    },

    clearCypressCookies() {
      return _.each(Cookies.get(), function(value, key) {
        if (isNamespaced(key)) {
          return Cookies.remove(key, {
            path: "/",
            domain
          });
        }
      });
    },

    setInitial() {
      return this.setCy("initial", true);
    },

    defaults(obj = {}) {
      //# merge obj into defaults
      return _.extend(defaults, obj);
    }

  };

  _.each(["get", "set", "remove", "getAllCookies", "clearCookies"], method => API[method] = () => $errUtils.throwErrByPath("cookies.removed_method", {
    args: { method }
  }));

  return API;
};

$Cookies.create = (namespace, domain) => //# set the $Cookies function onto the Cypress instance
$Cookies(namespace, domain);

module.exports = $Cookies;
