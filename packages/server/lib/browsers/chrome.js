"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var bluebird_1 = __importDefault(require("bluebird"));
var check_more_types_1 = __importDefault(require("check-more-types"));
var debug_1 = __importDefault(require("debug"));
var lazy_ass_1 = __importDefault(require("lazy-ass"));
var lodash_1 = __importDefault(require("lodash"));
var os_1 = __importDefault(require("os"));
var path_1 = __importDefault(require("path"));
var extension_1 = __importDefault(require("@packages/extension"));
var app_data_1 = __importDefault(require("../util/app_data"));
var fs_1 = __importDefault(require("../util/fs"));
var cdp_automation_1 = require("./cdp_automation");
var CriClient = __importStar(require("./cri-client"));
var protocol = __importStar(require("./protocol"));
var utils_1 = __importDefault(require("./utils"));
var debug = debug_1.default('cypress:server:browsers:chrome');
var LOAD_EXTENSION = '--load-extension=';
var CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING = '66 67'.split(' ');
var CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK = 72;
var CHROME_PREFERENCE_PATHS = {
    default: path_1.default.join('Default', 'Preferences'),
    defaultSecure: path_1.default.join('Default', 'Secure Preferences'),
    localState: 'Local State',
};
var pathToExtension = extension_1.default.getPathToExtension();
var pathToTheme = extension_1.default.getPathToTheme();
var DEFAULT_ARGS = [
    '--test-type',
    '--ignore-certificate-errors',
    '--start-maximized',
    '--silent-debugger-extension-api',
    '--no-default-browser-check',
    '--no-first-run',
    '--noerrdialogs',
    '--enable-fixed-layout',
    '--disable-popup-blocking',
    '--disable-password-generation',
    '--disable-save-password-bubble',
    '--disable-single-click-autofill',
    '--disable-prompt-on-repos',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-renderer-throttling',
    '--disable-restore-session-state',
    '--disable-translate',
    '--disable-new-profile-management',
    '--disable-new-avatar-menu',
    '--allow-insecure-localhost',
    '--reduce-security-for-testing',
    '--enable-automation',
    '--disable-device-discovery-notifications',
    '--disable-infobars',
    // https://github.com/cypress-io/cypress/issues/2376
    '--autoplay-policy=no-user-gesture-required',
    // http://www.chromium.org/Home/chromium-security/site-isolation
    // https://github.com/cypress-io/cypress/issues/1951
    '--disable-site-isolation-trials',
    // the following come frome chromedriver
    // https://code.google.com/p/chromium/codesearch#chromium/src/chrome/test/chromedriver/chrome_launcher.cc&sq=package:chromium&l=70
    '--metrics-recording-only',
    '--disable-prompt-on-repost',
    '--disable-hang-monitor',
    '--disable-sync',
    // this flag is causing throttling of XHR callbacks for
    // as much as 30 seconds. If you VNC in and open dev tools or
    // click on a button, it'll "instantly" work. with this
    // option enabled, it will time out some of our tests in circle
    // "--disable-background-networking"
    '--disable-web-resources',
    '--safebrowsing-disable-auto-update',
    '--safebrowsing-disable-download-protection',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-default-apps',
    // These flags are for webcam/WebRTC testing
    // https://github.com/cypress-io/cypress/issues/2704
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    // so Cypress commands don't get throttled
    // https://github.com/cypress-io/cypress/issues/5132
    '--disable-ipc-flooding-protection',
    // misc. options puppeteer passes
    // https://github.com/cypress-io/cypress/issues/3633
    '--disable-backgrounding-occluded-window',
    '--disable-breakpad',
    '--password-store=basic',
    '--use-mock-keychain',
];
/**
 * Reads all known preference files (CHROME_PREFERENCE_PATHS) from disk and retur
 * @param userDir
 */
var _getChromePreferences = function (userDir) {
    debug('reading chrome preferences... %o', { userDir: userDir, CHROME_PREFERENCE_PATHS: CHROME_PREFERENCE_PATHS });
    return bluebird_1.default.props(lodash_1.default.mapValues(CHROME_PREFERENCE_PATHS, function (prefPath) {
        return fs_1.default.readJson(path_1.default.join(userDir, prefPath))
            .catch(function (err) {
            // return empty obj if it doesn't exist
            if (err.code === 'ENOENT') {
                return {};
            }
            throw err;
        });
    }));
};
var _mergeChromePreferences = function (originalPrefs, newPrefs) {
    return lodash_1.default.mapValues(CHROME_PREFERENCE_PATHS, function (_v, prefPath) {
        var original = lodash_1.default.cloneDeep(originalPrefs[prefPath]);
        if (!newPrefs[prefPath]) {
            return original;
        }
        var deletions = [];
        lodash_1.default.mergeWith(original, newPrefs[prefPath], function (_objValue, newValue, key, obj) {
            if (newValue == null) {
                // setting a key to null should remove it
                deletions.push([obj, key]);
            }
        });
        deletions.forEach(function (_a) {
            var obj = _a[0], key = _a[1];
            delete obj[key];
        });
        return original;
    });
};
var _writeChromePreferences = function (userDir, originalPrefs, newPrefs) {
    return bluebird_1.default.map(lodash_1.default.keys(originalPrefs), function (key) {
        var originalJson = originalPrefs[key];
        var newJson = newPrefs[key];
        if (!newJson || lodash_1.default.isEqual(originalJson, newJson)) {
            return;
        }
        return fs_1.default.outputJson(path_1.default.join(userDir, CHROME_PREFERENCE_PATHS[key]), newJson);
    })
        .return();
};
var getRemoteDebuggingPort = function () { return __awaiter(void 0, void 0, void 0, function () {
    var port;
    return __generator(this, function (_a) {
        port = Number(process.env.CYPRESS_REMOTE_DEBUGGING_PORT);
        return [2 /*return*/, port || utils_1.default.getPort()];
    });
}); };
/**
 * Merge the different `--load-extension` arguments into one.
 *
 * @param extPath path to Cypress extension
 * @param args all browser args
 * @param browser the current browser being launched
 * @returns the modified list of arguments
 */
var _normalizeArgExtensions = function (extPath, args, pluginExtensions, browser) {
    if (browser.isHeadless) {
        return args;
    }
    var userExtensions = [];
    var loadExtension = lodash_1.default.find(args, function (arg) {
        return arg.includes(LOAD_EXTENSION);
    });
    if (loadExtension) {
        args = lodash_1.default.without(args, loadExtension);
        // form into array, enabling users to pass multiple extensions
        userExtensions = userExtensions.concat(loadExtension.replace(LOAD_EXTENSION, '').split(','));
    }
    if (pluginExtensions) {
        userExtensions = userExtensions.concat(pluginExtensions);
    }
    var extensions = [].concat(userExtensions, extPath, pathToTheme);
    args.push(LOAD_EXTENSION + lodash_1.default.compact(extensions).join(','));
    return args;
};
// we now store the extension in each browser profile
var _removeRootExtension = function () {
    return fs_1.default
        .removeAsync(app_data_1.default.path('extensions'))
        .catchReturn(null);
}; // noop if doesn't exist fails for any reason
// https://github.com/cypress-io/cypress/issues/2048
var _disableRestorePagesPrompt = function (userDir) {
    var prefsPath = path_1.default.join(userDir, 'Default', 'Preferences');
    return fs_1.default.readJson(prefsPath)
        .then(function (preferences) {
        var profile = preferences.profile;
        if (profile) {
            if ((profile['exit_type'] !== 'Normal') || (profile['exited_cleanly'] !== true)) {
                debug('cleaning up unclean exit status');
                profile['exit_type'] = 'Normal';
                profile['exited_cleanly'] = true;
                return fs_1.default.outputJson(prefsPath, preferences);
            }
        }
    })
        .catch(function () { });
};
// After the browser has been opened, we can connect to
// its remote interface via a websocket.
var _connectToChromeRemoteInterface = function (port, onError) {
    // @ts-ignore
    lazy_ass_1.default(check_more_types_1.default.userPort(port), 'expected port number to connect CRI to', port);
    debug('connecting to Chrome remote interface at random port %d', port);
    return protocol.getWsTargetFor(port)
        .then(function (wsUrl) {
        debug('received wsUrl %s for port %d', wsUrl, port);
        return CriClient.create(wsUrl, onError);
    });
};
var _maybeRecordVideo = function (client, options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!options.onScreencastFrame) {
                        debug('options.onScreencastFrame is false');
                        return [2 /*return*/, client];
                    }
                    debug('starting screencast');
                    client.on('Page.screencastFrame', options.onScreencastFrame);
                    return [4 /*yield*/, client.send('Page.startScreencast', {
                            format: 'jpeg',
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, client];
            }
        });
    });
};
// a utility function that navigates to the given URL
// once Chrome remote interface client is passed to it.
var _navigateUsingCRI = function (client, url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // @ts-ignore
                    lazy_ass_1.default(check_more_types_1.default.url(url), 'missing url to navigate to', url);
                    lazy_ass_1.default(client, 'could not get CRI client');
                    debug('received CRI client');
                    debug('navigating to page %s', url);
                    // when opening the blank page and trying to navigate
                    // the focus gets lost. Restore it and then navigate.
                    return [4 /*yield*/, client.send('Page.bringToFront')];
                case 1:
                    // when opening the blank page and trying to navigate
                    // the focus gets lost. Restore it and then navigate.
                    _a.sent();
                    return [4 /*yield*/, client.send('Page.navigate', { url: url })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
};
var _setAutomation = function (client, automation) {
    return automation.use(cdp_automation_1.CdpAutomation(client.send));
};
module.exports = {
    //
    // tip:
    //   by adding utility functions that start with "_"
    //   as methods here we can easily stub them from our unit tests
    //
    _normalizeArgExtensions: _normalizeArgExtensions,
    _removeRootExtension: _removeRootExtension,
    _connectToChromeRemoteInterface: _connectToChromeRemoteInterface,
    _maybeRecordVideo: _maybeRecordVideo,
    _navigateUsingCRI: _navigateUsingCRI,
    _setAutomation: _setAutomation,
    _getChromePreferences: _getChromePreferences,
    _mergeChromePreferences: _mergeChromePreferences,
    _writeChromePreferences: _writeChromePreferences,
    _writeExtension: function (browser, options) {
        return __awaiter(this, void 0, void 0, function () {
            var str, extensionDest, extensionBg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (browser.isHeadless) {
                            debug('chrome is running headlessly, not installing extension');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, extension_1.default.setHostAndPath(options.proxyUrl, options.socketIoRoute)];
                    case 1:
                        str = _a.sent();
                        extensionDest = utils_1.default.getExtensionDir(browser, options.isTextTerminal);
                        extensionBg = path_1.default.join(extensionDest, 'background.js');
                        // copy the extension src to the extension dist
                        return [4 /*yield*/, utils_1.default.copyExtension(pathToExtension, extensionDest)];
                    case 2:
                        // copy the extension src to the extension dist
                        _a.sent();
                        return [4 /*yield*/, fs_1.default.writeFileAsync(extensionBg, str)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, extensionDest];
                }
            });
        });
    },
    _getArgs: function (browser, options, port) {
        var args = [].concat(DEFAULT_ARGS);
        if (os_1.default.platform() === 'linux') {
            args.push('--disable-gpu');
            args.push('--no-sandbox');
        }
        var ua = options.userAgent;
        if (ua) {
            args.push("--user-agent=" + ua);
        }
        var ps = options.proxyServer;
        if (ps) {
            args.push("--proxy-server=" + ps);
        }
        if (options.chromeWebSecurity === false) {
            args.push('--disable-web-security');
            args.push('--allow-running-insecure-content');
        }
        // prevent AUT shaking in 66 & 67, but flag breaks chrome in 68+
        // https://github.com/cypress-io/cypress/issues/2037
        // https://github.com/cypress-io/cypress/issues/2215
        // https://github.com/cypress-io/cypress/issues/2223
        var majorVersion = browser.majorVersion, isHeadless = browser.isHeadless;
        if (CHROME_VERSIONS_WITH_BUGGY_ROOT_LAYER_SCROLLING.includes(majorVersion)) {
            args.push('--disable-blink-features=RootLayerScrolling');
        }
        // https://chromium.googlesource.com/chromium/src/+/da790f920bbc169a6805a4fb83b4c2ab09532d91
        // https://github.com/cypress-io/cypress/issues/1872
        if (majorVersion >= CHROME_VERSION_INTRODUCING_PROXY_BYPASS_ON_LOOPBACK) {
            args.push('--proxy-bypass-list=<-loopback>');
        }
        if (isHeadless) {
            args.push('--headless');
            // set the window size for headless to a better default
            // https://github.com/cypress-io/cypress/issues/6210
            args.push('--window-size=1280,720');
        }
        // force ipv4
        // https://github.com/cypress-io/cypress/issues/5912
        args.push("--remote-debugging-port=" + port);
        args.push('--remote-debugging-address=127.0.0.1');
        return args;
    },
    open: function (browser, url, options, automation) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var isTextTerminal, userDir, _a, port, preferences, defaultArgs, defaultLaunchOptions, _b, cacheDir, launchOptions, extDest, args, launchedBrowser, criClient, originalBrowserKill;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        isTextTerminal = options.isTextTerminal;
                        userDir = utils_1.default.getProfileDir(browser, isTextTerminal);
                        return [4 /*yield*/, bluebird_1.default.all([
                                getRemoteDebuggingPort(),
                                _getChromePreferences(userDir),
                            ])];
                    case 1:
                        _a = _c.sent(), port = _a[0], preferences = _a[1];
                        defaultArgs = this._getArgs(browser, options, port);
                        defaultLaunchOptions = utils_1.default.getDefaultLaunchOptions({
                            preferences: preferences,
                            args: defaultArgs,
                        });
                        return [4 /*yield*/, bluebird_1.default.all([
                                // ensure that we have a clean cache dir
                                // before launching the browser every time
                                utils_1.default.ensureCleanCache(browser, isTextTerminal),
                                utils_1.default.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options),
                            ])];
                    case 2:
                        _b = _c.sent(), cacheDir = _b[0], launchOptions = _b[1];
                        if (launchOptions.preferences) {
                            launchOptions.preferences = _mergeChromePreferences(preferences, launchOptions.preferences);
                        }
                        return [4 /*yield*/, bluebird_1.default.all([
                                this._writeExtension(browser, options),
                                _removeRootExtension(),
                                _disableRestorePagesPrompt(userDir),
                                _writeChromePreferences(userDir, preferences, launchOptions.preferences),
                            ])
                            // normalize the --load-extensions argument by
                            // massaging what the user passed into our own
                        ];
                    case 3:
                        extDest = (_c.sent())[0];
                        args = _normalizeArgExtensions(extDest, launchOptions.args, launchOptions.extensions, browser);
                        // this overrides any previous user-data-dir args
                        // by being the last one
                        args.push("--user-data-dir=" + userDir);
                        args.push("--disk-cache-dir=" + cacheDir);
                        debug('launching in chrome with debugging port', { url: url, args: args, port: port });
                        return [4 /*yield*/, utils_1.default.launch(browser, 'about:blank', args)];
                    case 4:
                        launchedBrowser = _c.sent();
                        lazy_ass_1.default(launchedBrowser, 'did not get launched browser instance');
                        return [4 /*yield*/, this._connectToChromeRemoteInterface(port, options.onError)];
                    case 5:
                        criClient = _c.sent();
                        lazy_ass_1.default(criClient, 'expected Chrome remote interface reference', criClient);
                        return [4 /*yield*/, criClient.ensureMinimumProtocolVersion('1.3')
                                .catch(function (err) {
                                throw new Error("Cypress requires at least Chrome 64.\n\nDetails:\n" + err.message);
                            })];
                    case 6:
                        _c.sent();
                        this._setAutomation(criClient, automation);
                        originalBrowserKill = launchedBrowser.kill;
                        launchedBrowser.kill = function () {
                            var args = [];
                            for (var _i = 0; _i < arguments.length; _i++) {
                                args[_i] = arguments[_i];
                            }
                            return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            debug('closing remote interface client');
                                            return [4 /*yield*/, criClient.close()];
                                        case 1:
                                            _a.sent();
                                            debug('closing chrome');
                                            return [4 /*yield*/, originalBrowserKill.apply(launchedBrowser, args)];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        };
                        return [4 /*yield*/, this._maybeRecordVideo(criClient, options)];
                    case 7:
                        _c.sent();
                        return [4 /*yield*/, this._navigateUsingCRI(criClient, url)
                            // return the launched browser process
                            // with additional method to close the remote connection
                        ];
                    case 8:
                        _c.sent();
                        // return the launched browser process
                        // with additional method to close the remote connection
                        return [2 /*return*/, launchedBrowser];
                }
            });
        });
    },
};
