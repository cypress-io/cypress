/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require("lodash");
const cp = require("child_process");
const path = require("path");
const debug = require("debug")("cypress:server:plugins");
const Promise = require("bluebird");
const errors = require("../errors");
const util = require("./util");

let pluginsProcess = null;
let registeredEvents = {};
let handlers = [];

const register = function(event, callback) {
  debug(`register event '${event}'`);

  if (!_.isString(event)) {
    throw new Error(`The plugin register function must be called with an event as its 1st argument. You passed '${event}'.`);
  }

  if (!_.isFunction(callback)) {
    throw new Error(`The plugin register function must be called with a callback function as its 2nd argument. You passed '${callback}'.`);
  }

  return registeredEvents[event] = callback;
};

module.exports = {
  //# for testing
  _setPluginsProcess(_pluginsProcess) {
    return pluginsProcess = _pluginsProcess;
  },

  getPluginPid() {
    if (pluginsProcess) {
      return pluginsProcess.pid;
    }
  },

  registerHandler(handler) {
    return handlers.push(handler);
  },

  init(config, options) {
    debug("plugins.init", config.pluginsFile);

    return new Promise(function(resolve, reject) {
      if (!config.pluginsFile) { return resolve(); }

      if (pluginsProcess) {
        debug("kill existing plugins process");
        pluginsProcess.kill();
      }

      registeredEvents = {};

      const childIndexFilename = path.join(__dirname, "child", "index.js");
      const childArguments = ["--file", config.pluginsFile];
      const childOptions = {
        stdio: "inherit"
      };

      if (config.resolvedNodePath) {
        debug("launching using custom node version %o", _.pick(config, ['resolvedNodePath', 'resolvedNodeVersion']));
        childOptions.execPath = config.resolvedNodePath;
      }

      debug("forking to run %s", childIndexFilename);
      pluginsProcess = cp.fork(childIndexFilename, childArguments, childOptions);
      const ipc = util.wrapIpc(pluginsProcess);

      for (let handler of handlers) { handler(ipc); }

      ipc.send("load", config);

      ipc.on("loaded", function(newCfg, registrations) {
        _.each(registrations, function(registration) {
          debug("register plugins process event", registration.event, "with id", registration.eventId);

          return register(registration.event, (...args) => util.wrapParentPromise(ipc, registration.eventId, function(invocationId) {
            debug("call event", registration.event, "for invocation id", invocationId);
            const ids = {
              eventId: registration.eventId,
              invocationId
            };
            return ipc.send("execute", registration.event, ids, args);
          }));
        });

        debug("resolving with new config %o", newCfg);
        return resolve(newCfg);
      });

      ipc.on("load:error", function(type, ...args) {
        debug("load:error %s, rejecting", type);
        return reject(errors.get(type, ...args));
      });

      const killPluginsProcess = function() {
        pluginsProcess && pluginsProcess.kill();
        return pluginsProcess = null;
      };

      const handleError = function(err) {
        debug("plugins process error:", err.stack);
        if (!pluginsProcess) { return; } //# prevent repeating this in case of multiple errors
        killPluginsProcess();
        err = errors.get("PLUGINS_ERROR", err.annotated || err.stack || err.message);
        err.title = "Error running plugin";
        return options.onError(err);
      };

      const handleWarning = function(warningErr) {
        debug("plugins process warning:", warningErr.stack);
        if (!pluginsProcess) { return; } //# prevent repeating this in case of multiple warnings
        return options.onWarning(warningErr);
      };

      pluginsProcess.on("error", handleError);
      ipc.on("error", handleError);
      ipc.on("warning", handleWarning);

      //# see timers/parent.js line #93 for why this is necessary
      return process.on("exit", killPluginsProcess);
    });
  },

  register,

  has(event) {
    const isRegistered = !!registeredEvents[event];

    debug("plugin event registered? %o", {
      event,
      isRegistered
    });

    return isRegistered;
  },

  execute(event, ...args) {
    debug(`execute plugin event '${event}' Node '${process.version}' with args: %o %o %o`, ...args);
    return registeredEvents[event](...args);
  },

  //# for testing purposes
  _reset() {
    registeredEvents = {};
    return handlers = [];
  }
};
