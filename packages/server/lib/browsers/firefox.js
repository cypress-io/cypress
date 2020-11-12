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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var bluebird_1 = __importDefault(require("bluebird"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var debug_1 = __importDefault(require("debug"));
var get_port_1 = __importDefault(require("get-port"));
var path_1 = __importDefault(require("path"));
var url_1 = __importDefault(require("url"));
var firefox_profile_1 = __importDefault(require("firefox-profile"));
var firefox_util_1 = __importDefault(require("./firefox-util"));
var utils_1 = __importDefault(require("./utils"));
var launcherDebug = __importStar(require("@packages/launcher/lib/log"));
var events_1 = require("events");
var os_1 = __importDefault(require("os"));
var tree_kill_1 = __importDefault(require("tree-kill"));
var errors = require('../errors');
var debug = debug_1.default('cypress:server:browsers:firefox');
var defaultPreferences = {
    /**
     * Taken from https://github.com/puppeteer/puppeteer/blob/8b49dc62a62282543ead43541316e23d3450ff3c/lib/Launcher.js#L520
     * with minor modifications
     * BEGIN: Copyright 2017 Google Inc. All rights reserved. Licensed under the Apache License, Version 2.0
     */
    // Make sure Shield doesn't hit the network.
    'app.normandy.api_url': '',
    // Disable Firefox old build background check
    'app.update.checkInstallTime': false,
    // Disable automatically upgrading Firefox
    'app.update.disabledForTesting': true,
    // Increase the APZ content response timeout to 1 minute
    'apz.content_response_timeout': 60000,
    // Prevent various error message on the console
    // jest-puppeteer asserts that no error message is emitted by the console
    'browser.contentblocking.features.standard': '-tp,tpPrivate,cookieBehavior0,-cm,-fp',
    // Enable the dump function: which sends messages to the system
    // console
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1543115
    'browser.dom.window.dump.enabled': true,
    // Disable topstories
    'browser.newtabpage.activity-stream.feeds.section.topstories': false,
    // Always display a blank page
    'browser.newtabpage.enabled': false,
    // Background thumbnails in particular cause grief: and disabling
    // thumbnails in general cannot hurt
    'browser.pagethumbnails.capturing_disabled': true,
    // Disable safebrowsing components.
    'browser.safebrowsing.blockedURIs.enabled': false,
    'browser.safebrowsing.downloads.enabled': false,
    'browser.safebrowsing.malware.enabled': false,
    'browser.safebrowsing.passwords.enabled': false,
    'browser.safebrowsing.phishing.enabled': false,
    // Disable updates to search engines.
    'browser.search.update': false,
    // Do not restore the last open set of tabs if the browser has crashed
    'browser.sessionstore.resume_from_crash': false,
    // Skip check for default browser on startup
    'browser.shell.checkDefaultBrowser': false,
    // Disable newtabpage
    'browser.startup.homepage': 'about:blank',
    // Do not redirect user when a milstone upgrade of Firefox is detected
    'browser.startup.homepage_override.mstone': 'ignore',
    // Start with a blank page about:blank
    'browser.startup.page': 0,
    // Do not allow background tabs to be zombified on Android: otherwise for
    // tests that open additional tabs: the test harness tab itself might get
    // unloaded
    'browser.tabs.disableBackgroundZombification': false,
    // Do not warn when closing all other open tabs
    'browser.tabs.warnOnCloseOtherTabs': false,
    // Do not warn when multiple tabs will be opened
    'browser.tabs.warnOnOpen': false,
    // Disable the UI tour.
    'browser.uitour.enabled': false,
    // Turn off search suggestions in the location bar so as not to trigger
    // network connections.
    'browser.urlbar.suggest.searches': false,
    // Disable first run splash page on Windows 10
    'browser.usedOnWindows10.introURL': '',
    // Do not warn on quitting Firefox
    'browser.warnOnQuit': false,
    // Do not show datareporting policy notifications which can
    // interfere with tests
    'datareporting.healthreport.about.reportUrl': '',
    'datareporting.healthreport.documentServerURI': '',
    'datareporting.healthreport.logging.consoleEnabled': false,
    'datareporting.healthreport.service.enabled': false,
    'datareporting.healthreport.service.firstRun': false,
    'datareporting.healthreport.uploadEnabled': false,
    'datareporting.policy.dataSubmissionEnabled': false,
    'datareporting.policy.dataSubmissionPolicyAccepted': false,
    'datareporting.policy.dataSubmissionPolicyBypassNotification': true,
    // DevTools JSONViewer sometimes fails to load dependencies with its require.js.
    // This doesn't affect Puppeteer but spams console (Bug 1424372)
    'devtools.jsonview.enabled': false,
    // Disable popup-blocker
    'dom.disable_open_during_load': false,
    // Enable the support for File object creation in the content process
    // Required for |Page.setFileInputFiles| protocol method.
    'dom.file.createInChild': true,
    // Disable the ProcessHangMonitor
    'dom.ipc.reportProcessHangs': false,
    // Disable slow script dialogues
    'dom.max_chrome_script_run_time': 0,
    'dom.max_script_run_time': 0,
    // Only load extensions from the application and user profile
    // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
    'extensions.autoDisableScopes': 0,
    'extensions.enabledScopes': 5,
    // Disable metadata caching for installed add-ons by default
    'extensions.getAddons.cache.enabled': false,
    // Disable installing any distribution extensions or add-ons.
    'extensions.installDistroAddons': false,
    // Disabled screenshots extension
    'extensions.screenshots.disabled': true,
    // Turn off extension updates so they do not bother tests
    'extensions.update.enabled': false,
    // Turn off extension updates so they do not bother tests
    'extensions.update.notifyUser': false,
    // Make sure opening about:addons will not hit the network
    'extensions.webservice.discoverURL': '',
    // Allow the application to have focus even it runs in the background
    'focusmanager.testmode': true,
    // Disable useragent updates
    'general.useragent.updates.enabled': false,
    // Always use network provider for geolocation tests so we bypass the
    // macOS dialog raised by the corelocation provider
    'geo.provider.testing': true,
    // Do not scan Wifi
    'geo.wifi.scan': false,
    // No hang monitor
    'hangmonitor.timeout': 0,
    // Show chrome errors and warnings in the error console
    'javascript.options.showInConsole': true,
    // Disable download and usage of OpenH264: and Widevine plugins
    'media.gmp-manager.updateEnabled': false,
    // Prevent various error message on the console
    // jest-puppeteer asserts that no error message is emitted by the console
    'network.cookie.cookieBehavior': 0,
    // Do not prompt for temporary redirects
    'network.http.prompt-temp-redirect': false,
    // Disable speculative connections so they are not reported as leaking
    // when they are hanging around
    'network.http.speculative-parallel-limit': 0,
    // Do not automatically switch between offline and online
    'network.manage-offline-status': false,
    // Make sure SNTP requests do not hit the network
    'network.sntp.pools': '',
    // Disable Flash.
    'plugin.state.flash': 0,
    'privacy.trackingprotection.enabled': false,
    // Enable Remote Agent
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1544393
    'remote.enabled': true,
    // Don't do network connections for mitm priming
    'security.certerrors.mitm.priming.enabled': false,
    // Local documents have access to all other local documents,
    // including directory listings
    'security.fileuri.strict_origin_policy': false,
    // Do not wait for the notification button security delay
    'security.notification_enable_delay': 0,
    // Ensure blocked updates do not hit the network
    'services.settings.server': '',
    // Do not automatically fill sign-in forms with known usernames and
    // passwords
    'signon.autofillForms': false,
    // Disable password capture, so that tests that include forms are not
    // influenced by the presence of the persistent doorhanger notification
    'signon.rememberSignons': false,
    // Disable first-run welcome page
    'startup.homepage_welcome_url': 'about:blank',
    // Disable first-run welcome page
    'startup.homepage_welcome_url.additional': '',
    // Disable browser animations (tabs, fullscreen, sliding alerts)
    'toolkit.cosmeticAnimations.enabled': false,
    'toolkit.telemetry.server': "''",
    // Prevent starting into safe mode after application crashes
    'toolkit.startup.max_resumed_crashes': -1,
    /**
     * END: Copyright 2017 Google Inc. All rights reserved.
     */
    'network.proxy.type': 1,
    // necessary for adding extensions
    'devtools.debugger.remote-enabled': true,
    // bind foxdriver to 127.0.0.1
    'devtools.debugger.remote-host': '127.0.0.1',
    // devtools.debugger.remote-port is set per-launch
    'devtools.debugger.prompt-connection': false,
    // "devtools.debugger.remote-websocket": true
    'devtools.chrome.enabled': true,
    'app.update.auto': false,
    'app.update.enabled': false,
    'browser.displayedE10SNotice': 4,
    'browser.download.manager.showWhenStarting': false,
    'browser.EULA.override': true,
    'browser.EULA.3.accepted': true,
    'browser.link.open_external': 2,
    'browser.link.open_newwindow': 2,
    'browser.offline': false,
    'browser.reader.detectedFirstArticle': true,
    'browser.selfsupport.url': '',
    'browser.tabs.warnOnClose': false,
    'devtools.errorconsole.enabled': true,
    'extensions.blocklist.enabled': false,
    'extensions.checkCompatibility.nightly': false,
    'extensions.logging.enabled': true,
    'javascript.enabled': true,
    'network.http.phishy-userpass-length': 255,
    'offline-apps.allow_by_default': true,
    'prompts.tab_modal.enabled': false,
    'security.fileuri.origin_policy': 3,
    'toolkit.networkmanager.disable': true,
    'toolkit.telemetry.prompted': 2,
    'toolkit.telemetry.enabled': false,
    'toolkit.telemetry.rejected': true,
    'xpinstall.signatures.required': false,
    'xpinstall.whitelist.required': false,
    'browser.laterrun.enabled': false,
    'browser.newtab.url': 'about:blank',
    'dom.report_all_js_exceptions': true,
    'network.captive-portal-service.enabled': false,
    'security.csp.enable': false,
    'webdriver_accept_untrusted_certs': true,
    'webdriver_assume_untrusted_issuer': true,
    'toolkit.legacyUserProfileCustomizations.stylesheets': true,
    // setting to true hides system window bar, but causes weird resizing issues.
    'browser.tabs.drawInTitlebar': false,
    // allow playing videos w/o user interaction
    'media.autoplay.default': 0,
    'browser.safebrowsing.enabled': false,
    // allow capturing screen through getUserMedia(...)
    // and auto-accept the permissions prompt
    'media.getusermedia.browser.enabled': true,
    'media.navigator.permission.disabled': true,
    'dom.min_background_timeout_value': 4,
    'dom.timeout.enable_budget_timer_throttling': false,
    // allow getUserMedia APIs on insecure domains
    'media.devices.insecure.enabled': true,
    'media.getusermedia.insecure.enabled': true,
    'marionette.log.level': launcherDebug.log.enabled ? 'Debug' : undefined,
};
function _createDetachedInstance(browserInstance) {
    var detachedInstance = new events_1.EventEmitter();
    detachedInstance.pid = browserInstance.pid;
    // kill the entire process tree, from the spawned instance up
    detachedInstance.kill = function () {
        tree_kill_1.default(browserInstance.pid, function (err, result) {
            debug('force-exit of process tree complete %o', { err: err, result: result });
            detachedInstance.emit('exit');
        });
    };
    return detachedInstance;
}
exports._createDetachedInstance = _createDetachedInstance;
function open(browser, url, options) {
    if (options === void 0) { options = {}; }
    return __awaiter(this, void 0, bluebird_1.default, function () {
        var defaultLaunchOptions, ps, _a, hostname, port, protocol, ua, _b, foxdriverPort, marionettePort, _c, cacheDir, extensionDest, launchOptions, profileDir, profile, xulStorePath, sizemode, pref, value, userCSSPath, userCss, _d, browserInstance;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    defaultLaunchOptions = utils_1.default.getDefaultLaunchOptions({
                        extensions: [],
                        preferences: lodash_1.default.extend({}, defaultPreferences),
                        args: [
                            '-marionette',
                            '-new-instance',
                            '-foreground',
                            '-start-debugger-server',
                            '-no-remote',
                        ],
                    });
                    if (browser.isHeadless) {
                        defaultLaunchOptions.args.push('-headless');
                    }
                    debug('firefox open %o', options);
                    ps = options.proxyServer;
                    if (ps) {
                        _a = url_1.default.parse(ps), hostname = _a.hostname, port = _a.port, protocol = _a.protocol;
                        if (port == null) {
                            port = protocol === 'https:' ? '443' : '80';
                        }
                        lodash_1.default.extend(defaultLaunchOptions.preferences, {
                            'network.proxy.allow_hijacking_localhost': true,
                            'network.proxy.http': hostname,
                            'network.proxy.ssl': hostname,
                            'network.proxy.http_port': +port,
                            'network.proxy.ssl_port': +port,
                            'network.proxy.no_proxies_on': '',
                        });
                    }
                    ua = options.userAgent;
                    if (ua) {
                        defaultLaunchOptions.preferences['general.useragent.override'] = ua;
                    }
                    return [4 /*yield*/, bluebird_1.default.all([get_port_1.default(), get_port_1.default()])];
                case 1:
                    _b = _e.sent(), foxdriverPort = _b[0], marionettePort = _b[1];
                    defaultLaunchOptions.preferences['devtools.debugger.remote-port'] = foxdriverPort;
                    defaultLaunchOptions.preferences['marionette.port'] = marionettePort;
                    debug('available ports: %o', { foxdriverPort: foxdriverPort, marionettePort: marionettePort });
                    return [4 /*yield*/, bluebird_1.default.all([
                            utils_1.default.ensureCleanCache(browser, options.isTextTerminal),
                            utils_1.default.writeExtension(browser, options.isTextTerminal, options.proxyUrl, options.socketIoRoute),
                            utils_1.default.executeBeforeBrowserLaunch(browser, defaultLaunchOptions, options),
                        ])];
                case 2:
                    _c = _e.sent(), cacheDir = _c[0], extensionDest = _c[1], launchOptions = _c[2];
                    if (Array.isArray(launchOptions.extensions)) {
                        launchOptions.extensions.push(extensionDest);
                    }
                    else {
                        launchOptions.extensions = [extensionDest];
                    }
                    profileDir = utils_1.default.getProfileDir(browser, options.isTextTerminal);
                    profile = new firefox_profile_1.default({
                        destinationDirectory: profileDir,
                    });
                    debug('firefox directories %o', { path: profile.path(), cacheDir: cacheDir, extensionDest: extensionDest });
                    xulStorePath = path_1.default.join(profile.path(), 'xulstore.json');
                    return [4 /*yield*/, fs_extra_1.default.pathExists(xulStorePath)];
                case 3:
                    if (!!(_e.sent())) return [3 /*break*/, 5];
                    sizemode = 'maximized';
                    return [4 /*yield*/, fs_extra_1.default.writeJSON(xulStorePath, { 'chrome://browser/content/browser.xhtml': { 'main-window': { 'width': 1280, 'height': 1024, sizemode: sizemode } } })];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    launchOptions.preferences['browser.cache.disk.parent_directory'] = cacheDir;
                    for (pref in launchOptions.preferences) {
                        value = launchOptions.preferences[pref];
                        profile.setPreference(pref, value);
                    }
                    // TODO: fix this - synchronous FS operation
                    profile.updatePreferences();
                    userCSSPath = path_1.default.join(profileDir, 'chrome');
                    return [4 /*yield*/, fs_extra_1.default.pathExists(path_1.default.join(userCSSPath, 'userChrome.css'))];
                case 6:
                    if (!!(_e.sent())) return [3 /*break*/, 12];
                    userCss = "\n    #urlbar:not(.megabar), #urlbar.megabar > #urlbar-background, #searchbar {\n      background: -moz-Field !important;\n      color: -moz-FieldText !important;\n    }\n  ";
                    _e.label = 7;
                case 7:
                    _e.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, fs_extra_1.default.mkdir(userCSSPath)];
                case 8:
                    _e.sent();
                    return [3 /*break*/, 10];
                case 9:
                    _d = _e.sent();
                    return [3 /*break*/, 10];
                case 10: return [4 /*yield*/, fs_extra_1.default.writeFile(path_1.default.join(profileDir, 'chrome', 'userChrome.css'), userCss)];
                case 11:
                    _e.sent();
                    _e.label = 12;
                case 12:
                    launchOptions.args = launchOptions.args.concat([
                        '-profile',
                        profile.path(),
                    ]);
                    debug('launch in firefox', { url: url, args: launchOptions.args });
                    return [4 /*yield*/, utils_1.default.launch(browser, 'about:blank', launchOptions.args)];
                case 13:
                    browserInstance = _e.sent();
                    return [4 /*yield*/, firefox_util_1.default.setup({ extensions: launchOptions.extensions, url: url, foxdriverPort: foxdriverPort, marionettePort: marionettePort })
                            .catch(function (err) {
                            errors.throw('FIREFOX_COULD_NOT_CONNECT', err);
                        })];
                case 14:
                    _e.sent();
                    if (os_1.default.platform() === 'win32') {
                        // override the .kill method for Windows so that the detached Firefox process closes between specs
                        // @see https://github.com/cypress-io/cypress/issues/6392
                        return [2 /*return*/, _createDetachedInstance(browserInstance)];
                    }
                    return [2 /*return*/, browserInstance];
            }
        });
    });
}
exports.open = open;
