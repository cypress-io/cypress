/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const whatIsCircular = require("@cypress/what-is-circular");
const moment = require("moment");
const UrlParse = require("url-parse");
const Promise = require("bluebird");

const $utils = require("../../cypress/utils");
const $errUtils = require("../../cypress/error_utils");
const $Log = require("../../cypress/log");
const $Location = require("../../cypress/location");

const debug = require('debug')('cypress:driver:navigation');

let id                    = null;
let previousDomainVisited = null;
let hasVisitedAboutBlank  = null;
let currentlyVisitingAboutBlank = null;
let knownCommandCausedInstability = null;

const REQUEST_URL_OPTS = "auth failOnStatusCode retryOnNetworkFailure retryOnStatusCodeFailure method body headers"
.split(" ");

const VISIT_OPTS = "url log onBeforeLoad onLoad timeout requestTimeout"
.split(" ")
.concat(REQUEST_URL_OPTS);

const reset = function(test = {}) {
  knownCommandCausedInstability = false;

  //# continuously reset this
  //# before each test run!
  previousDomainVisited = false;

  //# make sure we reset that we haven't
  //# visited about blank again
  hasVisitedAboutBlank = false;

  currentlyVisitingAboutBlank = false;

  return id = test.id;
};

const VALID_VISIT_METHODS = ['GET', 'POST'];

const isValidVisitMethod = method => _.includes(VALID_VISIT_METHODS, method);

const timedOutWaitingForPageLoad = function(ms, log) {
  debug('timedOutWaitingForPageLoad');
  return $errUtils.throwErrByPath("navigation.timed_out", {
    args: {
      configFile: Cypress.config("configFile"),
      ms
    },
    onFail: log
  });
};

const bothUrlsMatchAndRemoteHasHash = (current, remote) => //# the remote has a hash
//# or the last char of href
//# is a hash
//# both must have the same query params
(remote.hash || (remote.href.slice(-1) === "#")) &&

  //# both must have the same origin
  (current.origin === remote.origin) &&

    //# both must have the same pathname
    (current.pathname === remote.pathname) && current.search === remote.search;

const cannotVisitDifferentOrigin = function(origin, previousUrlVisited, remoteUrl, existingUrl, log) {
  const differences = [];

  if (remoteUrl.protocol !== existingUrl.protocol) {
    differences.push('protocol');
  }
  if (remoteUrl.port !== existingUrl.port) {
    differences.push('port');
  }
  if (remoteUrl.superDomain !== existingUrl.superDomain) {
    differences.push('superdomain');
  }

  const errOpts = {
    onFail: log,
    args: {
      differences: differences.join(', '),
      previousUrl: previousUrlVisited,
      attemptedUrl: origin
    }
  };

  return $errUtils.throwErrByPath("visit.cannot_visit_different_origin", errOpts);
};

const specifyFileByRelativePath = (url, log) => $errUtils.throwErrByPath("visit.specify_file_by_relative_path", {
  onFail: log,
  args: {
    attemptedUrl: url
  }
});

const aboutBlank = win => new Promise(function(resolve) {
  cy.once("window:load", resolve);

  return $utils.locHref("about:blank", win);
});

const navigationChanged = function(Cypress, cy, state, source, arg) {
  //# get the current url of our remote application
  let left;
  const url = cy.getRemoteLocation("href");
  debug('navigation changed:', url);

  //# dont trigger for empty url's or about:blank
  if (_.isEmpty(url) || (url === "about:blank")) { return; }

  //# start storing the history entries
  const urls = (left = state("urls")) != null ? left : [];

  const previousUrl = _.last(urls);

  //# ensure our new url doesnt match whatever
  //# the previous was. this prevents logging
  //# additionally when the url didnt actually change
  if (url === previousUrl) { return; }

  //# else notify the world and log this event
  Cypress.action("cy:url:changed", url);

  urls.push(url);

  state("urls", urls);

  state("url", url);

  //# don't output a command log for 'load' or 'before:load' events
  // return if source in command
  if (knownCommandCausedInstability) { return; }

  //# ensure our new url doesnt match whatever
  //# the previous was. this prevents logging
  //# additionally when the url didnt actually change
  return Cypress.log({
    name: "new url",
    message: url,
    event: true,
    type: "parent",
    end: true,
    snapshot: true,
    consoleProps() {
      const obj = {
        "New Url": url
      };

      if (source) {
        obj["Url Updated By"] = source;
      }

      if (arg) {
        obj.Args = arg;
      }

      return obj;
    }
  });
};

const formSubmitted = (Cypress, e) => Cypress.log({
  type: "parent",
  name: "form sub",
  message: "--submitting form--",
  event: true,
  end: true,
  snapshot: true,
  consoleProps() { return {
    "Originated From": e.target,
    "Args": e
  }; }
});

const pageLoading = function(bool, state) {
  if (state("pageLoading") === bool) { return; }

  state("pageLoading", bool);

  return Cypress.action("app:page:loading", bool);
};

const stabilityChanged = function(Cypress, state, config, stable, event) {
  debug('stabilityChanged:', stable);
  if (currentlyVisitingAboutBlank) {
    if (stable === false) {
      //# if we're currently visiting about blank
      //# and becoming unstable for the first time
      //# notifiy that we're page loading
      pageLoading(true, state);
      return;
    } else {
      //# else wait until after we finish visiting
      //# about blank
      return;
    }
  }

  //# let the world know that the app is page:loading
  pageLoading(!stable, state);

  //# if we aren't becoming unstable
  //# then just return now
  if (stable !== false) { return; }

  //# if we purposefully just caused the page to load
  //# (and thus instability) don't log this out
  if (knownCommandCausedInstability) { return; }

  //# bail if we dont have a runnable
  //# because beforeunload can happen at any time
  //# we may no longer be testing and thus dont
  //# want to fire a new loading event
  //# TODO
  //# this may change in the future since we want
  //# to add debuggability in the chrome console
  //# which at that point we may keep runnable around
  if (!state("runnable")) { return; }

  const options = {};

  _.defaults(options, {
    timeout: config("pageLoadTimeout")
  });

  options._log = Cypress.log({
    type: "parent",
    name: "page load",
    message: "--waiting for new page to load--",
    event: true,
    consoleProps() { return {
      Note: "This event initially fires when your application fires its 'beforeunload' event and completes when your application fires its 'load' event after the next page loads."
    }; }
  });

  cy.clearTimeout("page load");

  const onPageLoadErr = function(err) {
    state("onPageLoadErr", null);

    const { originPolicy } = $Location.create(window.location.href);

    try {
      return $errUtils.throwErrByPath("navigation.cross_origin", {
        onFail: options._log,
        args: {
          configFile: Cypress.config("configFile"),
          message: err.message,
          originPolicy
        }
      });
    } catch (error) {
      err = error;
      return err;
    }
  };

  state("onPageLoadErr", onPageLoadErr);

  const loading = function() {
    debug('waiting for window:load');
    return new Promise((resolve, reject) => cy.once("window:load", function() {
      cy.state("onPageLoadErr", null);

      options._log.set("message", "--page loaded--").snapshot().end();

      return resolve();
    }));
  };

  const reject = function(err) {
    let r;
    if (r = state("reject")) {
      return r(err);
    }
  };

  return loading()
  .timeout(options.timeout, "page load")
  .catch(Promise.TimeoutError, function() {
    //# clean this up
    cy.state("onPageLoadErr", null);

    try {
      return timedOutWaitingForPageLoad(options.timeout, options._log);
    } catch (err) {
      return reject(err);
    }
  });
};

const normalizeTimeoutOptions = options => //# there are really two timeout values - pageLoadTimeout
//# and the underlying responseTimeout. for the purposes
//# of resolving resolving the url, we only care about
//# responseTimeout - since pageLoadTimeout is a driver
//# and browser concern. therefore we normalize the options
//# object and send 'responseTimeout' as options.timeout
//# for the backend.
_
.chain(options)
.pick(REQUEST_URL_OPTS)
.extend({ timeout: options.responseTimeout })
.value();

module.exports = function(Commands, Cypress, cy, state, config) {
  reset();

  Cypress.on("test:before:run:async", () => //# reset any state on the backend
  Cypress.backend('reset:server:state'));

  Cypress.on("test:before:run", reset);

  Cypress.on("stability:changed", (bool, event) => //# only send up page loading events when we're
  //# not stable!
  stabilityChanged(Cypress, state, config, bool, event));

  Cypress.on("navigation:changed", (source, arg) => navigationChanged(Cypress, cy, state, source, arg));

  Cypress.on("form:submitted", e => formSubmitted(Cypress, e));

  const visitFailedByErr = function(err, url, fn) {
    err.url = url;

    Cypress.action("cy:visit:failed", err);

    return fn();
  };

  const requestUrl = (url, options = {}) => Cypress.backend(
    "resolve:url",
    url,
    normalizeTimeoutOptions(options)
  )
  .then(function(resp = {}) {
    switch (false) {
      //# if we didn't even get an OK response
      //# then immediately die
      case !!resp.isOkStatusCode:
        var err = new Error;
        err.gotResponse = true;
        _.extend(err, resp);

        throw err;

      case !!resp.isHtml:
        //# throw invalid contentType error
        err = new Error;
        err.invalidContentType = true;
        _.extend(err, resp);

        throw err;

      default:
        return resp;
    }
  });

  Cypress.on("window:before:load", function(contentWindow) {
    //# TODO: just use a closure here
    const current = state("current");

    if (!current) { return; }

    const runnable = state("runnable");

    if (!runnable) { return; }

    const options = _.last(current.get("args"));
    return __guard__(options != null ? options.onBeforeLoad : undefined, x => x.call(runnable.ctx, contentWindow));
  });

  return Commands.addAll({
    reload(...args) {
      let forceReload, userOptions;
      const throwArgsErr = () => {
        return $errUtils.throwErrByPath("reload.invalid_arguments");
      };

      switch (args.length) {
        case 0:
          forceReload = false;
          userOptions = {};
          break;

        case 1:
          if (_.isObject(args[0])) {
            userOptions = args[0];
          } else {
            forceReload = args[0];
          }
          break;

        case 2:
          forceReload = args[0];
          userOptions = args[1];
          break;

        default:
          throwArgsErr();
      }

      //# clear the current timeout
      cy.clearTimeout("reload");

      let cleanup = null;
      const options = _.defaults({}, userOptions, {
        log: true,
        timeout: config("pageLoadTimeout")
      });

      const reload = () => new Promise(function(resolve, reject) {
        if (forceReload == null) { forceReload = false; }
        if (userOptions == null) { userOptions = {}; }

        if (!_.isObject(userOptions)) {
          throwArgsErr();
        }

        if (!_.isBoolean(forceReload)) {
          throwArgsErr();
        }

        if (options.log) {
          options._log = Cypress.log({});

          options._log.snapshot("before", {next: "after"});
        }

        cleanup = function() {
          knownCommandCausedInstability = false;

          return cy.removeListener("window:load", resolve);
        };

        knownCommandCausedInstability = true;

        cy.once("window:load", resolve);

        return $utils.locReload(forceReload, state("window"));
      });

      return reload()
      .timeout(options.timeout, "reload")
      .catch(Promise.TimeoutError, err => timedOutWaitingForPageLoad(options.timeout, options._log)).finally(function() {
        if (typeof cleanup === 'function') {
          cleanup();
        }

        return null;
      });
    },

    go(numberOrString, options = {}) {
      const userOptions = options;
      options = _.defaults({}, userOptions, {
        log: true,
        timeout: config("pageLoadTimeout")
      });

      if (options.log) {
        options._log = Cypress.log({
        });
      }

      const win = state("window");

      const goNumber = function(num) {
        if (num === 0) {
          $errUtils.throwErrByPath("go.invalid_number", { onFail: options._log });
        }

        let cleanup = null;

        if (options._log) {
          options._log.snapshot("before", {next: "after"});
        }

        const go = () => Promise.try(function() {
          let didUnload = false;

          const beforeUnload = () => didUnload = true;

          //# clear the current timeout
          cy.clearTimeout();

          cy.once("window:before:unload", beforeUnload);

          const didLoad = new Promise(function(resolve) {
            cleanup = function() {
              cy.removeListener("window:load", resolve);
              return cy.removeListener("window:before:unload", beforeUnload);
            };

            return cy.once("window:load", resolve);
          });

          knownCommandCausedInstability = true;

          win.history.go(num);

          const retWin = () => //# need to set the attributes of 'go'
          //# consoleProps here with win

          //# make sure we resolve our go function
          //# with the remove window (just like cy.visit)
          state("window");

          return Promise
          .delay(100)
          .then(function() {
            knownCommandCausedInstability = false;

            //# if we've didUnload then we know we're
            //# doing a full page refresh and we need
            //# to wait until
            if (didUnload) {
              return didLoad.then(retWin);
            } else {
              return retWin();
            }
          });
        });

        return go()
        .timeout(options.timeout, "go")
        .catch(Promise.TimeoutError, err => timedOutWaitingForPageLoad(options.timeout, options._log)).finally(function() {
          if (typeof cleanup === 'function') {
            cleanup();
          }

          return null;
        });
      };

      const goString = function(str) {
        switch (str) {
          case "forward": return goNumber(1);
          case "back":    return goNumber(-1);
          default:
            return $errUtils.throwErrByPath("go.invalid_direction", {
              onFail: options._log,
              args: { str }
            });
        }
      };

      switch (false) {
        case !_.isFinite(numberOrString): return goNumber(numberOrString);
        case !_.isString(numberOrString): return goString(numberOrString);
        default:
          return $errUtils.throwErrByPath("go.invalid_argument", { onFail: options._log });
      }
    },

    visit(url, options = {}) {
      let baseUrl, message, path, qs;
      if (options.url && url) {
        $errUtils.throwErrByPath("visit.no_duplicate_url", { args: { optionsUrl: options.url, url }});
      }
      let userOptions = options;

      if (userOptions.url && url) {
        $utils.throwErrByPath("visit.no_duplicate_url", { args: { optionsUrl: userOptions.url, url }});
      }

      if (_.isObject(url) && _.isEqual(userOptions, {})) {
        //# options specified as only argument
        userOptions = url;
        ({
          url
        } = userOptions);
      }

      if (!_.isString(url)) {
        $errUtils.throwErrByPath("visit.invalid_1st_arg");
      }

      const consoleProps = {};

      if (!_.isEmpty(userOptions)) {
        consoleProps["Options"] = _.pick(userOptions, VISIT_OPTS);
      }

      options = _.defaults({}, userOptions, {
        auth: null,
        failOnStatusCode: true,
        retryOnNetworkFailure: true,
        retryOnStatusCodeFailure: false,
        method: 'GET',
        body: null,
        headers: {},
        log: true,
        responseTimeout: config('responseTimeout'),
        timeout: config("pageLoadTimeout"),
        onBeforeLoad() {},
        onLoad() {}
      });

      if (!_.isUndefined(options.qs) && !_.isObject(options.qs)) {
        $errUtils.throwErrByPath("visit.invalid_qs", { args: { qs: String(options.qs) }});
      }

      if (options.retryOnStatusCodeFailure && !options.failOnStatusCode) {
        $errUtils.throwErrByPath("visit.status_code_flags_invalid");
      }

      if (!isValidVisitMethod(options.method)) {
        $errUtils.throwErrByPath("visit.invalid_method", { args: { method: options.method }});
      }

      if (!_.isObject(options.headers)) {
        $errUtils.throwErrByPath("visit.invalid_headers");
      }

      if (_.isObject(options.body) && (path = whatIsCircular(options.body))) {
        $errUtils.throwErrByPath("visit.body_circular", { args: { path }});
      }

      if (options.log) {
        message = url;

        if (options.method !== 'GET') {
          message = `${options.method} ${message}`;
        }

        options._log = Cypress.log({
          message,
          consoleProps() { return consoleProps; }
        });
      }

      url = $Location.normalize(url);

      if (baseUrl = config("baseUrl")) {
        url = $Location.qualifyWithBaseUrl(baseUrl, url);
      }

      if (qs = options.qs) {
        url = $Location.mergeUrlWithParams(url, qs);
      }

      let cleanup = null;

      //# clear the current timeout
      cy.clearTimeout("visit");

      let win        = state("window");
      const $autIframe = state("$autIframe");
      const runnable   = state("runnable");

      const changeIframeSrc = (url, event) => //# when the remote iframe's load event fires
      //# callback fn
      new Promise(function(resolve) {
        //# if we're listening for hashchange
        //# events then change the strategy
        //# to listen to this event emitting
        //# from the window and not cy
        //# see issue 652 for why.
        //# the hashchange events are firing too
        //# fast for us. They even resolve asynchronously
        //# before other application's hashchange events
        //# have even fired.
        if (event === "hashchange") {
          win.addEventListener("hashchange", resolve);
        } else {
          cy.once(event, resolve);
        }

        cleanup = function() {
          if (event === "hashchange") {
            win.removeEventListener("hashchange", resolve);
          } else {
            cy.removeListener(event, resolve);
          }

          return knownCommandCausedInstability = false;
        };

        knownCommandCausedInstability = true;

        return $utils.iframeSrc($autIframe, url);
      });

      const onLoad = function({runOnLoadCallback, totalTime}) {
        //# reset window on load
        win = state("window");

        //# the onLoad callback should only be skipped if specified
        if (runOnLoadCallback !== false) {
          if (options.onLoad != null) {
            options.onLoad.call(runnable.ctx, win);
          }
        }

        if (options._log) {
          options._log.set({
            url,
            totalTime
          });
        }

        return Promise.resolve(win);
      };

      const go = function() {
        //# hold onto our existing url
        let a, remoteUrl;
        const existing = $utils.locExisting();

        //# TODO: $Location.resolve(existing.origin, url)

        if ($Location.isLocalFileUrl(url)) {
          return specifyFileByRelativePath(url, options._log);
        }

        //# in the case we are visiting a relative url
        //# then prepend the existing origin to it
        //# so we get the right remote url
        if (!$Location.isFullyQualifiedUrl(url)) {
          remoteUrl = $Location.fullyQualifyUrl(url);
        }

        let remote = $Location.create(remoteUrl != null ? remoteUrl : url);

        //# reset auth options if we have them
        if (a = remote.authObj) {
          options.auth = a;
        }

        //# store the existing hash now since
        //# we'll need to apply it later
        const existingHash = remote.hash != null ? remote.hash : "";
        const existingAuth = remote.auth != null ? remote.auth : "";

        if (previousDomainVisited && (remote.originPolicy !== existing.originPolicy)) {
          //# if we've already visited a new superDomain
          //# then die else we'd be in a terrible endless loop
          return cannotVisitDifferentOrigin(remote.origin, previousDomainVisited, remote, existing, options._log);
        }

        const current = $Location.create(win.location.href);

        //# if all that is changing is the hash then we know
        //# the browser won't actually make a new http request
        //# for this, and so we need to resolve onLoad immediately
        //# and bypass the actual visit resolution stuff
        if (bothUrlsMatchAndRemoteHasHash(current, remote)) {
          //# https://github.com/cypress-io/cypress/issues/1311
          if (current.hash === remote.hash) {
            consoleProps["Note"] = "Because this visit was to the same hash, the page did not reload and the onBeforeLoad and onLoad callbacks did not fire.";

            return onLoad({runOnLoadCallback: false});
          }

          return changeIframeSrc(remote.href, "hashchange")
          .then(onLoad);
        }

        if (existingHash) {
          //# strip out the existing hash if we have one
          //# before telling our backend to resolve this url
          url = url.replace(existingHash, "");
        }

        if (existingAuth) {
          //# strip out the existing url if we have one
          url = url.replace(existingAuth + "@", "");
        }

        return requestUrl(url, options)
        .then((resp = {}) => {
          let cookies, filePath, originalUrl, redirects;
          ({url, originalUrl, cookies, redirects, filePath} = resp);

          //# reapply the existing hash
          url         += existingHash;
          originalUrl += existingHash;

          if (filePath) {
            consoleProps["File Served"] = filePath;
          } else {
            if (url !== originalUrl) {
              consoleProps["Original Url"] = originalUrl;
            }
          }

          if (options.log) {
            message = options._log.get('message');

            if (redirects && redirects.length) {
              message = [message].concat(redirects).join(" -> ");
            }

            options._log.set({message});
          }

          consoleProps["Resolved Url"]  = url;
          consoleProps["Redirects"]     = redirects;
          consoleProps["Cookies Set"]   = cookies;

          remote = $Location.create(url);

          //# if the origin currently matches
          //# then go ahead and change the iframe's src
          //# and we're good to go
          // if origin is existing.origin
          if (remote.originPolicy === existing.originPolicy) {
            previousDomainVisited = remote.origin;

            url = $Location.fullyQualifyUrl(url);

            return changeIframeSrc(url, "window:load")
            .then(() => onLoad(resp));
          } else {
            //# if we've already visited a new origin
            //# then die else we'd be in a terrible endless loop
            if (previousDomainVisited) {
              return cannotVisitDifferentOrigin(remote.origin, previousDomainVisited, remote, existing, options._log);
            }

            //# tell our backend we're changing domains
            //# TODO: add in other things we want to preserve
            //# state for like scrollTop
            let s = {
              currentId: id,
              tests:     Cypress.getTestsState(),
              startTime: Cypress.getStartTime(),
              emissions: Cypress.getEmissions()
            };

            s.passed  = Cypress.countByTestState(s.tests, "passed");
            s.failed  = Cypress.countByTestState(s.tests, "failed");
            s.pending = Cypress.countByTestState(s.tests, "pending");
            s.numLogs = $Log.countLogsByTests(s.tests);

            return Cypress.action("cy:collect:run:state")
            .then(function(a = []) {
              //# merge all the states together holla'
              s = _.reduce(a, (memo, obj) => _.extend(memo, obj)
              , s);

              return Cypress.backend("preserve:run:state", s);}).then(function() {
              //# and now we must change the url to be the new
              //# origin but include the test that we're currently on
              const newUri = new UrlParse(remote.origin);
              newUri
              .set("pathname", existing.pathname)
              .set("query",    existing.search)
              .set("hash",     existing.hash);

              //# replace is broken in electron so switching
              //# to href for now
              // $utils.locReplace(window, newUri.toString())
              $utils.locHref(newUri.toString(), window);

              //# we are returning a Promise which never resolves
              //# because we're changing top to be a brand new URL
              //# and want to block the rest of our commands
              return Promise.delay(1e9);
            });
          }
      }).catch(function(err) {
          switch (false) {
            case !err.gotResponse: case !err.invalidContentType:
              return visitFailedByErr(err, err.originalUrl, function() {
                const args = {
                  url:         err.originalUrl,
                  path:        err.filePath,
                  status:      err.status,
                  statusText:  err.statusText,
                  redirects:   err.redirects,
                  contentType: err.contentType
                };

                const msg = (() => { switch (false) {
                  case !err.gotResponse:
                    var type = err.filePath ? "file" : "http";

                    return `visit.loading_${type}_failed`;

                  case !err.invalidContentType:
                    return "visit.loading_invalid_content_type";
                } })();

                return $errUtils.throwErrByPath(msg, {
                  onFail: options._log,
                  args
                });
              });
            default:
              return visitFailedByErr(err, url, () => $errUtils.throwErrByPath("visit.loading_network_failed", {
                onFail: options._log,
                args: {
                  url,
                  error: err,
                  stack: err.stack
                },
                noStackTrace: true
              }));
          }
        });
      };

      const visit = function() {
        //# if we've visiting for the first time during
        //# a test then we want to first visit about:blank
        //# so that we nuke the previous state. subsequent
        //# visits will not navigate to about:blank so that
        //# our history entries are intact
        if (!hasVisitedAboutBlank) {
          hasVisitedAboutBlank = true;
          currentlyVisitingAboutBlank = true;

          return aboutBlank(win)
          .then(function() {
            currentlyVisitingAboutBlank = false;

            return go();
          });
        } else {
          return go();
        }
      };

      return visit()
      .timeout(options.timeout, "visit")
      .catch(Promise.TimeoutError, err => {
        return timedOutWaitingForPageLoad(options.timeout, options._log);
    }).finally(function() {
        if (typeof cleanup === 'function') {
          cleanup();
        }

        return null;
      });
    }
  });
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}