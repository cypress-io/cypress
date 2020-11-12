"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var bluebird_1 = __importDefault(require("bluebird"));
var electron_context_menu_1 = __importDefault(require("electron-context-menu"));
var electron_1 = require("electron");
var debug_1 = __importDefault(require("debug"));
var cwd_1 = __importDefault(require("../cwd"));
var saved_state_1 = __importDefault(require("../saved_state"));
var cyDesktop = require('@packages/desktop-gui');
var debug = debug_1.default('cypress:server:windows');
var windows = {};
var recentlyCreatedWindow = false;
var getUrl = function (type) {
    switch (type) {
        case 'INDEX':
            return cyDesktop.getPathToIndex();
        default:
            throw new Error("No acceptable window type found for: '" + type + "'");
    }
};
var getByType = function (type) {
    return windows[type];
};
var setWindowProxy = function (win) {
    if (!process.env.HTTP_PROXY) {
        return;
    }
    return win.webContents.session.setProxy({
        proxyRules: process.env.HTTP_PROXY,
        proxyBypassRules: process.env.NO_PROXY,
    });
};
function installExtension(win, path) {
    return win.webContents.session.loadExtension(path)
        .then(function (data) {
        debug('electron extension installed %o', { data: data, path: path });
    })
        .catch(function (err) {
        debug('error installing electron extension %o', { err: err, path: path });
        throw err;
    });
}
exports.installExtension = installExtension;
function removeAllExtensions(win) {
    var extensions;
    try {
        extensions = win.webContents.session.getAllExtensions();
        extensions.forEach(function (_a) {
            var id = _a.id;
            win.webContents.session.removeExtension(id);
        });
    }
    catch (err) {
        debug('error removing all extensions %o', { err: err, extensions: extensions });
    }
}
exports.removeAllExtensions = removeAllExtensions;
function reset() {
    windows = {};
}
exports.reset = reset;
function destroy(type) {
    var win;
    if (type && (win = getByType(type))) {
        return win.destroy();
    }
}
exports.destroy = destroy;
function get(type) {
    return getByType(type) || (function () {
        throw new Error("No window exists for: '" + type + "'");
    })();
}
exports.get = get;
function showAll() {
    return lodash_1.default.invoke(windows, 'showInactive');
}
exports.showAll = showAll;
function hideAllUnlessAnotherWindowIsFocused() {
    // bail if we have another focused window
    // or we are in the middle of creating a new one
    if (electron_1.BrowserWindow.getFocusedWindow() || recentlyCreatedWindow) {
        return;
    }
    // else hide all windows
    return lodash_1.default.invoke(windows, 'hide');
}
exports.hideAllUnlessAnotherWindowIsFocused = hideAllUnlessAnotherWindowIsFocused;
function focusMainWindow() {
    return getByType('INDEX').show();
}
exports.focusMainWindow = focusMainWindow;
function getByWebContents(webContents) {
    return electron_1.BrowserWindow.fromWebContents(webContents);
}
exports.getByWebContents = getByWebContents;
function _newBrowserWindow(options) {
    return new electron_1.BrowserWindow(options);
}
exports._newBrowserWindow = _newBrowserWindow;
function defaults(options) {
    if (options === void 0) { options = {}; }
    return lodash_1.default.defaultsDeep(options, {
        x: null,
        y: null,
        show: true,
        frame: true,
        width: null,
        height: null,
        minWidth: null,
        minHeight: null,
        devTools: false,
        trackState: false,
        contextMenu: false,
        recordFrameRate: null,
        onFocus: function () { },
        onBlur: function () { },
        onClose: function () { },
        onCrashed: function () { },
        onNewWindow: function () { },
        webPreferences: {
            partition: null,
            webSecurity: true,
            nodeIntegration: false,
            backgroundThrottling: false,
        },
    });
}
exports.defaults = defaults;
function create(projectRoot, _options, newBrowserWindow) {
    if (_options === void 0) { _options = {}; }
    if (newBrowserWindow === void 0) { newBrowserWindow = _newBrowserWindow; }
    var options = defaults(_options);
    if (options.show === false) {
        options.frame = false;
    }
    options.webPreferences.webSecurity = !!options.chromeWebSecurity;
    if (options.partition) {
        options.webPreferences.partition = options.partition;
    }
    var win = newBrowserWindow(options);
    win.on('blur', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return options.onBlur.apply(win, args);
    });
    win.on('focus', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return options.onFocus.apply(win, args);
    });
    win.once('closed', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        win.removeAllListeners();
        return options.onClose.apply(win, args);
    });
    // the webview loses focus on navigation, so we
    // have to refocus it everytime top navigates in headless mode
    // https://github.com/cypress-io/cypress/issues/2190
    if (options.show === false) {
        win.webContents.on('did-start-loading', function () {
            if (!win.isDestroyed()) {
                return win.focusOnWebView();
            }
        });
    }
    win.webContents.on('crashed', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return options.onCrashed.apply(win, args);
    });
    win.webContents.on('new-window', function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return options.onNewWindow.apply(win, args);
    });
    if (options.trackState) {
        trackState(projectRoot, options.isTextTerminal, win, options.trackState);
    }
    // open dev tools if they're true
    if (options.devTools) {
        // and possibly detach dev tools if true
        win.webContents.openDevTools();
    }
    if (options.contextMenu) {
        // adds context menu with copy, paste, inspect element, etc
        electron_context_menu_1.default({
            showInspectElement: true,
            window: win,
        });
    }
    return win;
}
exports.create = create;
function open(projectRoot, options, newBrowserWindow) {
    if (options === void 0) { options = {}; }
    if (newBrowserWindow === void 0) { newBrowserWindow = _newBrowserWindow; }
    // if we already have a window open based
    // on that type then just show + focus it!
    var win;
    win = getByType(options.type);
    if (win) {
        win.show();
        return bluebird_1.default.resolve(win);
    }
    recentlyCreatedWindow = true;
    lodash_1.default.defaults(options, {
        width: 600,
        height: 500,
        show: true,
        webPreferences: {
            preload: cwd_1.default('lib', 'ipc', 'ipc.js'),
        },
    });
    if (!options.url) {
        options.url = getUrl(options.type);
    }
    win = create(projectRoot, options, newBrowserWindow);
    debug('creating electron window with options %o', options);
    if (options.type) {
        windows[options.type] = win;
        win.once('closed', function () {
            delete windows[options.type];
        });
    }
    // enable our url to be a promise
    // and wait for this to be resolved
    return bluebird_1.default.join(options.url, setWindowProxy(win))
        .spread(function (url) {
        // navigate the window here!
        win.loadURL(url);
        recentlyCreatedWindow = false;
    }).thenReturn(win);
}
exports.open = open;
function trackState(projectRoot, isTextTerminal, win, keys) {
    var isDestroyed = function () {
        return win.isDestroyed();
    };
    win.on('resize', lodash_1.default.debounce(function () {
        if (isDestroyed()) {
            return;
        }
        var _a = win.getSize(), width = _a[0], height = _a[1];
        var _b = win.getPosition(), x = _b[0], y = _b[1];
        var newState = {};
        newState[keys.width] = width;
        newState[keys.height] = height;
        newState[keys.x] = x;
        newState[keys.y] = y;
        return saved_state_1.default.create(projectRoot, isTextTerminal)
            .then(function (state) {
            return state.set(newState);
        });
    }, 500));
    win.on('moved', lodash_1.default.debounce(function () {
        if (isDestroyed()) {
            return;
        }
        var _a = win.getPosition(), x = _a[0], y = _a[1];
        var newState = {};
        newState[keys.x] = x;
        newState[keys.y] = y;
        return saved_state_1.default.create(projectRoot, isTextTerminal)
            .then(function (state) {
            return state.set(newState);
        });
    }, 500));
    win.webContents.on('devtools-opened', function () {
        var newState = {};
        newState[keys.devTools] = true;
        return saved_state_1.default.create(projectRoot, isTextTerminal)
            .then(function (state) {
            return state.set(newState);
        });
    });
    return win.webContents.on('devtools-closed', function () {
        var newState = {};
        newState[keys.devTools] = false;
        return saved_state_1.default.create(projectRoot, isTextTerminal)
            .then(function (state) {
            return state.set(newState);
        });
    });
}
exports.trackState = trackState;
