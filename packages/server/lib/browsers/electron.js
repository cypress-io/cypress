/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _             = require("lodash");
const EE            = require("events");
const net           = require("net");
const Bluebird       = require("bluebird");
const debug         = require("debug")("cypress:server:browsers:electron");
const { cors }      = require("@packages/network");
const menu          = require("../gui/menu");
const Windows       = require("../gui/windows");
const appData       = require("../util/app_data");
const { CdpAutomation } = require("./cdp_automation");
const plugins       = require("../plugins");
const savedState    = require("../saved_state");
const profileCleaner = require("../util/profile_cleaner");
const utils         = require('./utils');
const errors        = require('../errors');

//# additional events that are nice to know about to be logged
//# https://electronjs.org/docs/api/browser-window#instance-events
const ELECTRON_DEBUG_EVENTS = [
  'close',
  'responsive',
  'session-end',
  'unresponsive'
];

let instance = null;

const tryToCall = function(win, method) {
  try {
    if (!win.isDestroyed()) {
      if (_.isString(method)) {
        return win[method]();
      } else {
        return method();
      }
    }
  } catch (err) {
    return debug("got error calling window method:", err.stack);
  }
};

const getAutomation = function(win) {
  const sendCommand = Bluebird.method((...args) => {
    return tryToCall(win, () => win.webContents.debugger.sendCommand
    .apply(win.webContents.debugger, args));
  });

  return CdpAutomation(sendCommand);
};

const _installExtensions = function(extensionPaths = [], options) {
  Windows.removeAllExtensions();

  return extensionPaths.forEach(function(path) {
    try {
      return Windows.installExtension(path);
    } catch (error) {
      return options.onWarning(errors.get('EXTENSION_NOT_LOADED', 'Electron', path));
    }
  });
};

module.exports = {
  _defaultOptions(projectRoot, state, options) {
    const _this = this;

    const defaults = {
      x: state.browserX,
      y: state.browserY,
      width: state.browserWidth || 1280,
      height: state.browserHeight || 720,
      devTools: state.isBrowserDevToolsOpen,
      minWidth: 100,
      minHeight: 100,
      contextMenu: true,
      partition: this._getPartition(options),
      trackState: {
        width: "browserWidth",
        height: "browserHeight",
        x: "browserX",
        y: "browserY",
        devTools: "isBrowserDevToolsOpen"
      },
      onFocus() {
        if (options.show) {
          return menu.set({withDevTools: true});
        }
      },
      onNewWindow(e, url) {
        const _win = this;

        return _this._launchChild(e, url, _win, projectRoot, state, options)
        .then(function(child) {
          //# close child on parent close
          _win.on("close", function() {
            if (!child.isDestroyed()) {
              return child.destroy();
            }
          });

          //# add this pid to list of pids
          return tryToCall(child, () => __guard__(instance != null ? instance.pid : undefined, x => x.push(child.webContents.getOSProcessId())));
        });
      }
    };

    return _.defaultsDeep({}, options, defaults);
  },

  _getAutomation: getAutomation,

  _render(url, projectRoot, automation, options = {}) {
    const win = Windows.create(projectRoot, options);

    automation.use(getAutomation(win));

    return this._launch(win, url, options);
  },

  _launchChild(e, url, parent, projectRoot, state, options) {
    e.preventDefault();

    const [parentX, parentY] = parent.getPosition();

    options = this._defaultOptions(projectRoot, state, options);

    _.extend(options, {
      x: parentX + 100,
      y: parentY + 100,
      trackState: false,
      onPaint: null //# dont capture paint events
    });

    const win = Windows.create(projectRoot, options);

    //# needed by electron since we prevented default and are creating
    //# our own BrowserWindow (https://electron.atom.io/docs/api/web-contents/#event-new-window)
    e.newGuest = win;

    return this._launch(win, url, options);
  },

  _launch(win, url, options) {
    if (options.show) {
      menu.set({withDevTools: true});
    }

    ELECTRON_DEBUG_EVENTS.forEach(e => win.on(e, () => debug("%s fired on the BrowserWindow %o", e, { browserWindowUrl: url })));

    return Bluebird.try(() => {
      return this._attachDebugger(win.webContents);
  }).then(() => {
      let ua;
      if (ua = options.userAgent) {
        this._setUserAgent(win.webContents, ua);
      }

      const setProxy = () => {
        let ps;
        if (ps = options.proxyServer) {
          return this._setProxy(win.webContents, ps);
        }
      };

      return Bluebird.join(
        setProxy(),
        this._clearCache(win.webContents)
      );
    }).then(() => win.loadURL(url)).then(() => {
      //# enabling can only happen once the window has loaded
      return this._enableDebugger(win.webContents);
    }).return(win);
  },

  _attachDebugger(webContents) {
    try {
      webContents.debugger.attach();
      debug("debugger attached");
    } catch (error) {
      const err = error;
      debug("debugger attached failed %o", { err });
      throw err;
    }

    const originalSendCommand = webContents.debugger.sendCommand;

    webContents.debugger.sendCommand = function(message, data) {
      debug('debugger: sending %s with params %o', message, data);

      return originalSendCommand.call(webContents.debugger, message, data)
      .then(function(res) {
        if (debug.enabled && (_.get(res, 'data.length') > 100)) {
          res = _.clone(res);
          res.data = res.data.slice(0, 100) + ' [truncated]';
        }
        debug('debugger: received response to %s: %o', message, res);
        return res;}).catch(function(err) {
        debug('debugger: received error on %s: %o', message, err);
        throw err;
      });
    };

    webContents.debugger.sendCommand('Browser.getVersion');

    webContents.debugger.on("detach", (event, reason) => debug("debugger detached due to %o", { reason }));

    return webContents.debugger.on("message", function(event, method, params) {
      if (method === "Console.messageAdded") {
        return debug("console message: %o", params.message);
      }
    });
  },

  _enableDebugger(webContents) {
    debug("debugger: enable Console and Network");
    return Bluebird.join(
      webContents.debugger.sendCommand("Console.enable"),
      webContents.debugger.sendCommand("Network.enable")
    );
  },

  _getPartition(options) {
    if (options.isTextTerminal) {
      //# create dynamic persisted run
      //# to enable parallelization
      return `persist:run-${process.pid}`;
    }

    //# we're in interactive mode and always
    //# use the same session
    return "persist:interactive";
  },

  _clearCache(webContents) {
    debug("clearing cache");
    return webContents.session.clearCache();
  },

  _setUserAgent(webContents, userAgent) {
    debug("setting user agent to:", userAgent);
    //# set both because why not
    webContents.userAgent = userAgent;
    return webContents.session.setUserAgent(userAgent);
  },

  _setProxy(webContents, proxyServer) {
    return webContents.session.setProxy({
      proxyRules: proxyServer,
      //# this should really only be necessary when
      //# running Chromium versions >= 72
      //# https://github.com/cypress-io/cypress/issues/1872
      proxyBypassRules: "<-loopback>"
    });
  },

  open(browser, url, options = {}, automation) {
    const { projectRoot, isTextTerminal } = options;

    debug("open %o", { browser, url });

    return savedState(projectRoot, isTextTerminal)
    .then(state => state.get()).then(state => {
      debug("received saved state %o", state);

      //# get our electron default options
      //# TODO: this is bad, don't mutate the options object
      options = this._defaultOptions(projectRoot, state, options);

      //# get the GUI window defaults now
      options = Windows.defaults(options);

      debug("browser window options %o", _.omitBy(options, _.isFunction));

      const defaultLaunchOptions = utils.getDefaultLaunchOptions({
        preferences: options,
      });

      return utils.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options);
    }).then(launchOptions => {
      const { preferences } = launchOptions;

      debug("launching browser window to url: %s", url);

      _installExtensions(launchOptions.extensions, options);

      return this._render(url, projectRoot, automation, preferences)
      .then(win => {
        //# cause the webview to receive focus so that
        //# native browser focus + blur events fire correctly
        //# https://github.com/cypress-io/cypress/issues/1939
        tryToCall(win, "focusOnWebView");

        const events = new EE;

        win.once("closed", function() {
          debug("closed event fired");

          Windows.removeAllExtensions();

          return events.emit("exit");
        });

        instance = _.extend(events, {
          pid:                [tryToCall(win, () => win.webContents.getOSProcessId())],
          browserWindow:      win,
          kill() { return tryToCall(win, "destroy"); },
          removeAllListeners() { return tryToCall(win, "removeAllListeners"); }
        });

        return instance;
      });
    });
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}