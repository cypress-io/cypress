/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const Promise = require("bluebird");

const $utils = require("../../cypress/utils");
const $errUtils = require("../../cypress/error_utils");
const $Server = require("../../cypress/server");
const $Location = require("../../cypress/location");

let server = null;

const tryDecodeUri = function(uri) {
  try {
    return decodeURI(uri);
  } catch (error) {
    return uri;
  }
};

const getServer = () => server != null ? server : unavailableErr();

const cancelPendingXhrs = function() {
  if (server) {
    server.cancelPendingXhrs();
  }

  return null;
};

const reset = function() {
  if (server) {
    server.restore();
  }

  return server = null;
};

const isUrlLikeArgs = (url, response) => (!_.isObject(url) && !_.isObject(response)) ||
  (_.isRegExp(url) || _.isString(url));

const getUrl = options => options.originalUrl || options.url;

var unavailableErr = () => $errUtils.throwErrByPath("server.unavailable");

const getDisplayName = function(route) {
  if (route && (route.response != null)) { return "xhr stub"; } else { return "xhr"; }
};

const stripOrigin = function(url) {
  const location = $Location.create(url);
  return url.replace(location.origin, "");
};

const getXhrServer = function(state) {
  let left;
  return (left = state("server")) != null ? left : unavailableErr();
};

const setRequest = function(state, xhr, alias) {
  let left;
  const requests = (left = state("requests")) != null ? left : [];

  requests.push({
    xhr,
    alias
  });

  return state("requests", requests);
};

const setResponse = function(state, xhr) {
  let left;
  const obj = _.find(state("requests"), { xhr });

  //# if we've been reset between tests and an xhr
  //# leaked through, then we may not be able to associate
  //# this response correctly
  if (!obj) { return; }

  const index = state("requests").indexOf(obj);

  const responses = (left = state("responses")) != null ? left : [];

  //# set the response in the same index as the request
  //# so we can later wait on this specific index'd response
  //# else its not deterministic
  responses[index] = {
    xhr,
    alias: (obj != null ? obj.alias : undefined)
  };

  return state("responses", responses);
};

const startXhrServer = function(cy, state, config) {
  const logs = {};

  server = $Server.create({
    xhrUrl: config("xhrUrl"),
    stripOrigin,

    //# shouldnt these stubs be called routes?
    //# rename everything related to stubs => routes
    onSend: (xhr, stack, route) => {
      let log, rl;
      const alias = route != null ? route.alias : undefined;

      setRequest(state, xhr, alias);

      if (rl = route && route.log) {
        const numResponses = rl.get("numResponses");
        rl.set("numResponses", numResponses + 1);
      }

      logs[xhr.id] = (log = Cypress.log({
        message:   "",
        name:      "xhr",
        displayName: getDisplayName(route),
        alias,
        aliasType: "route",
        type:      "parent",
        event:     true,
        consoleProps: () => {
          const consoleObj = {
            Alias:         alias,
            Method:        xhr.method,
            URL:           xhr.url,
            "Matched URL": (route != null ? route.url : undefined),
            Status:        xhr.statusMessage,
            Duration:      xhr.duration,
            "Stubbed":     route && (route.response != null) ? "Yes" : "No",
            Request:       xhr.request,
            Response:      xhr.response,
            XHR:           xhr._getXhr()
          };

          if (route && route.is404) {
            consoleObj.Note = "This request did not match any of your routes. It was automatically sent back '404'. Setting cy.server({force404: false}) will turn off this behavior.";
          }

          consoleObj.groups = () => [
            {
              name: "Initiator",
              items: [stack],
              label: false
            }
          ];

          return consoleObj;
        },
        renderProps() {
          let indicator;
          const status = (() => { switch (false) {
            case !xhr.aborted:
              indicator = "aborted";
              return "(aborted)";
            case !xhr.canceled:
              indicator = "aborted";
              return "(canceled)";
            case xhr.status <= 0:
              return xhr.status;
            default:
              indicator = "pending";
              return "---";
          } })();

          if (indicator == null) { indicator = /^2/.test(status) ? "successful" : "bad"; }

          return {
            indicator,
            message: `${xhr.method} ${status} ${stripOrigin(xhr.url)}`
          };
        }
      }));

      return log.snapshot("request");
    },

    onLoad: xhr => {
      let log;
      setResponse(state, xhr);

      if (log = logs[xhr.id]) {
        return log.snapshot("response").end();
      }
    },

    onNetworkError(xhr) {
      let log;
      const err = $errUtils.cypressErrByPath("xhr.network_error");

      if (log = logs[xhr.id]) {
        return log.snapshot("failed").error(err);
      }
    },

    onFixtureError(xhr, err) {
      err = $errUtils.cypressErr(err);

      return this.onError(xhr, err);
    },

    onError(xhr, err) {
      let log;
      err.onFail = function() {};

      if (log = logs[xhr.id]) {
        log.snapshot("error").error(err);
      }

      //# re-throw the error since this came from AUT code, and needs to
      //# cause an 'uncaught:exception' event. This error will be caught in
      //# top.onerror with stack as 5th argument.
      throw err;
    },

    onXhrAbort: (xhr, stack) => {
      let log;
      setResponse(state, xhr);

      const err = new Error($errUtils.errMsgByPath("xhr.aborted"));
      err.name = "AbortError";
      err.stack = stack;

      if (log = logs[xhr.id]) {
        return log.snapshot("aborted").error(err);
      }
    },

    onXhrCancel(xhr) {
      let log;
      setResponse(state, xhr);

      if (log = logs[xhr.id]) {
        return log.snapshot("canceled").set({
          ended: true,
          state: "failed"
        });
      }
    },

    onAnyAbort: (route, xhr) => {
      if (route && _.isFunction(route.onAbort)) {
        return route.onAbort.call(cy, xhr);
      }
    },

    onAnyRequest: (route, xhr) => {
      if (route && _.isFunction(route.onRequest)) {
        return route.onRequest.call(cy, xhr);
      }
    },

    onAnyResponse: (route, xhr) => {
      if (route && _.isFunction(route.onResponse)) {
        return route.onResponse.call(cy, xhr);
      }
    }
  });

  const win = state("window");

  server.bindTo(win);

  state("server", server);

  return server;
};

const defaults = {
  method: undefined,
  status: undefined,
  delay: undefined,
  headers: undefined, //# response headers
  response: undefined,
  autoRespond: undefined,
  waitOnResponses: undefined,
  onAbort: undefined,
  onRequest: undefined, //# need to rebind these to 'cy' context
  onResponse: undefined
};

module.exports = function(Commands, Cypress, cy, state, config) {
  reset();

  //# if our page is going away due to
  //# a form submit / anchor click then
  //# we need to cancel all pending
  //# XHR's so the command log displays
  //# correctly
  Cypress.on("window:unload", cancelPendingXhrs);

  Cypress.on("test:before:run", function() {
    //# reset the existing server
    reset();

    //# create the server before each test run
    //# its possible for this to fail if the
    //# last test we ran ended with an invalid
    //# window such as if the last test ended
    //# with a cross origin window
    try {
      server = startXhrServer(cy, state, config);
    } catch (err) {
      //# in this case, just don't bind to the server
      server = null;
    }

    return null;
  });

  Cypress.on("window:before:load", function(contentWindow) {
    if (server) {
      //# dynamically bind the server to whatever is currently running
      return server.bindTo(contentWindow);
    } else {
      //# if we don't have a server such as the case when
      //# the last window was cross origin, try to bind
      //# to it now
      return server = startXhrServer(cy, state, config);
    }
  });

  return Commands.addAll({
    server(options) {
      let userOptions = options;

      if (arguments.length === 0) {
        userOptions = {};
      }

      if (!_.isObject(userOptions)) {
        $errUtils.throwErrByPath("server.invalid_argument");
      }

      options = _.defaults({}, userOptions, {
        enable: true //# set enable to false to turn off stubbing
      });

      //# if we disable the server later make sure
      //# we cannot add cy.routes to it
      state("serverIsStubbed", options.enable);

      return getXhrServer(state).set(options);
    },

    route(...args) {
      //# TODO:
      //# if we return a function which returns a promise
      //# then we should be handling potential timeout issues
      //# just like cy.then does

      //# method / url / response / options
      //# url / response / options
      //# options

      //# by default assume we have a specified
      //# response from the user
      let o;
      let hasResponse = true;

      if (!state("serverIsStubbed")) {
        $errUtils.throwErrByPath("route.failed_prerequisites");
      }

      //# get the default options currently set
      //# on our server
      let options = (o = getXhrServer(state).getOptions());

      //# enable the entire routing definition to be a function
      const parseArgs = function(...args) {
        let alias;
        switch (false) {
          case !_.isObject(args[0]) || !!_.isRegExp(args[0]):
            //# we dont have a specified response
            if (!_.has(args[0], "response")) {
              hasResponse = false;
            }

            options = (o = _.extend({}, options, args[0]));
            break;

          case args.length !== 0:
            $errUtils.throwErrByPath("route.invalid_arguments");
            break;

          case args.length !== 1:
            o.url = args[0];

            hasResponse = false;
            break;

          case args.length !== 2:
            //# if our url actually matches an http method
            //# then we know the user doesn't want to stub this route
            if (_.isString(args[0]) && $utils.isValidHttpMethod(args[0])) {
              o.method = args[0];
              o.url    = args[1];

              hasResponse = false;
            } else {
              o.url      = args[0];
              o.response = args[1];
            }
            break;

          case args.length !== 3:
            if ($utils.isValidHttpMethod(args[0]) || isUrlLikeArgs(args[1], args[2])) {
              o.method    = args[0];
              o.url       = args[1];
              o.response  = args[2];
            } else {
              o.url       = args[0];
              o.response  = args[1];

              _.extend(o, args[2]);
            }
            break;

          case args.length !== 4:
            o.method    = args[0];
            o.url       = args[1];
            o.response  = args[2];

            _.extend(o, args[3]);
            break;
        }

        if (_.isString(o.method)) {
          o.method = o.method.toUpperCase();
        }

        _.defaults(options, defaults);

        if (!options.url) {
          $errUtils.throwErrByPath("route.url_missing");
        }

        if (!(_.isString(options.url) || _.isRegExp(options.url))) {
          $errUtils.throwErrByPath("route.url_invalid");
        }

        if (!$utils.isValidHttpMethod(options.method)) {
          $errUtils.throwErrByPath("route.method_invalid", {
            args: { method: o.method }
          });
        }

        if (hasResponse && (options.response == null)) {
          $errUtils.throwErrByPath("route.response_invalid");
        }

        //# convert to wildcard regex
        if (options.url === "*") {
          options.originalUrl = "*";
          options.url = /.*/;
        }

        //# look ahead to see if this
        //# command (route) has an alias?
        if (alias = cy.getNextAlias()) {
          options.alias = alias;
        }

        if (_.isFunction(o.response)) {
          const getResponse = () => {
            return o.response.call(state("runnable").ctx, options);
          };

          //# allow route to return a promise
          return Promise.try(getResponse)
          .then(function(resp) {
            options.response = resp;

            return route();
          });
        } else {
          return route();
        }
      };

      var route = function() {
        //# if our response is a string and
        //# a reference to an alias
        let aliasObj, decodedUrl;
        if (_.isString(o.response) && (aliasObj = cy.getAlias(o.response, "route"))) {
          //# reset the route's response to be the
          //# aliases subject
          options.response = aliasObj.subject;
        }

        const url = getUrl(options);

        const urlString = url.toString();

        //# https://github.com/cypress-io/cypress/issues/2372
        if ((decodedUrl = tryDecodeUri(urlString)) && (urlString !== decodedUrl)) {
          $errUtils.warnByPath("route.url_percentencoding_warning", { args: { decodedUrl }});
        }

        options.log = Cypress.log({
          name: "route",
          instrument: "route",
          method:   options.method,
          url:      getUrl(options),
          status:   options.status,
          response: options.response,
          alias:    options.alias,
          isStubbed: (options.response != null),
          numResponses: 0,
          consoleProps() {
            return {
              Method:   options.method,
              URL:      url,
              Status:   options.status,
              Response: options.response,
              Alias:    options.alias
            };
          }
        });

        return getXhrServer(state).route(options);
      };

      if (_.isFunction(args[0])) {
        const getArgs = () => {
          return args[0].call(state("runnable").ctx);
        };

        return Promise.try(getArgs)
        .then(parseArgs);
      } else {
        return parseArgs(...args);
      }
    }
  });
};
