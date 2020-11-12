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
var lodash_1 = __importDefault(require("lodash"));
// @ts-ignore
var errors_1 = __importDefault(require("../errors"));
// @ts-ignore
var plugins_1 = __importDefault(require("../plugins"));
var path = require('path');
var debug = require('debug')('cypress:server:browsers:utils');
var Bluebird = require('bluebird');
var getPort = require('get-port');
var launcher = require('@packages/launcher');
var fs = require('../util/fs');
var extension = require('@packages/extension');
var appData = require('../util/app_data');
var profileCleaner = require('../util/profile_cleaner');
var pathToBrowsers = appData.path('browsers');
var legacyProfilesWildcard = path.join(pathToBrowsers, '*');
var getAppDataPath = function (browser) {
    if (!browser || !browser.profilePath) {
        return pathToBrowsers;
    }
    return path.join(browser.profilePath, 'Cypress');
};
var getProfileWildcard = function (browser) {
    return path.join(getAppDataPath(browser), '*');
};
var getBrowserPath = function (browser) {
    // TODO need to check if browser.name is an unempty string
    return path.join(getAppDataPath(browser), browser.name + "-" + browser.channel);
};
var defaultLaunchOptions = {
    preferences: {},
    extensions: [],
    args: [],
};
var KNOWN_LAUNCH_OPTION_PROPERTIES = lodash_1.default.keys(defaultLaunchOptions);
var getDefaultLaunchOptions = function (options) {
    return lodash_1.default.defaultsDeep(options, defaultLaunchOptions);
};
var copyExtension = function (src, dest) {
    return fs.copyAsync(src, dest);
};
var getPartition = function (isTextTerminal) {
    if (isTextTerminal) {
        return "run-" + process.pid;
    }
    return 'interactive';
};
var getProfileDir = function (browser, isTextTerminal) {
    return path.join(getBrowserPath(browser), getPartition(isTextTerminal));
};
var getExtensionDir = function (browser, isTextTerminal) {
    return path.join(getProfileDir(browser, isTextTerminal), 'CypressExtension');
};
var ensureCleanCache = function (browser, isTextTerminal) {
    return __awaiter(this, void 0, void 0, function () {
        var p;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    p = path.join(getProfileDir(browser, isTextTerminal), 'CypressCache');
                    return [4 /*yield*/, fs.removeAsync(p)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs.ensureDirAsync(p)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, p];
            }
        });
    });
};
// we now store profiles inside the Cypress binary folder
// so we need to remove the legacy root profiles that existed before
function removeLegacyProfiles() {
    return profileCleaner.removeRootProfile(legacyProfilesWildcard, [
        path.join(legacyProfilesWildcard, 'run-*'),
        path.join(legacyProfilesWildcard, 'interactive'),
    ]);
}
var removeOldProfiles = function (browser) {
    // a profile is considered old if it was used
    // in a previous run for a PID that is either
    // no longer active, or isnt a cypress related process
    var pathToPartitions = appData.electronPartitionsPath();
    return Bluebird.all([
        removeLegacyProfiles(),
        profileCleaner.removeInactiveByPid(getProfileWildcard(browser), 'run-'),
        profileCleaner.removeInactiveByPid(pathToPartitions, 'run-'),
    ]);
};
var pathToExtension = extension.getPathToExtension();
function executeBeforeBrowserLaunch(browser, launchOptions, options) {
    return __awaiter(this, void 0, void 0, function () {
        var pluginConfigResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!plugins_1.default.has('before:browser:launch')) return [3 /*break*/, 2];
                    return [4 /*yield*/, plugins_1.default.execute('before:browser:launch', browser, launchOptions)];
                case 1:
                    pluginConfigResult = _a.sent();
                    if (pluginConfigResult) {
                        extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options);
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/, launchOptions];
            }
        });
    });
}
function extendLaunchOptionsFromPlugins(launchOptions, pluginConfigResult, options) {
    // if we returned an array from the plugin
    // then we know the user is using the deprecated
    // interface and we need to warn them
    // TODO: remove this logic in >= v5.0.0
    if (pluginConfigResult[0]) {
        options.onWarning(errors_1.default.get('DEPRECATED_BEFORE_BROWSER_LAUNCH_ARGS'));
        lodash_1.default.extend(pluginConfigResult, {
            args: lodash_1.default.filter(pluginConfigResult, function (_val, key) {
                return lodash_1.default.isNumber(key);
            }),
            extensions: [],
        });
    }
    else {
        // either warn about the array or potentially error on invalid props, but not both
        // strip out all the known launch option properties from the resulting object
        var unexpectedProperties = lodash_1.default
            .chain(pluginConfigResult)
            .omit(KNOWN_LAUNCH_OPTION_PROPERTIES)
            .keys()
            .value();
        if (unexpectedProperties.length) {
            errors_1.default.throw('UNEXPECTED_BEFORE_BROWSER_LAUNCH_PROPERTIES', unexpectedProperties, KNOWN_LAUNCH_OPTION_PROPERTIES);
        }
    }
    lodash_1.default.forEach(launchOptions, function (val, key) {
        var pluginResultValue = pluginConfigResult[key];
        if (pluginResultValue) {
            if (lodash_1.default.isPlainObject(val)) {
                launchOptions[key] = lodash_1.default.extend({}, launchOptions[key], pluginResultValue);
                return;
            }
            launchOptions[key] = pluginResultValue;
            return;
        }
    });
    return launchOptions;
}
module.exports = {
    extendLaunchOptionsFromPlugins: extendLaunchOptionsFromPlugins,
    executeBeforeBrowserLaunch: executeBeforeBrowserLaunch,
    defaultLaunchOptions: defaultLaunchOptions,
    getDefaultLaunchOptions: getDefaultLaunchOptions,
    getPort: getPort,
    copyExtension: copyExtension,
    getBrowserPath: getBrowserPath,
    getProfileDir: getProfileDir,
    getExtensionDir: getExtensionDir,
    ensureCleanCache: ensureCleanCache,
    removeOldProfiles: removeOldProfiles,
    getBrowserByPath: launcher.detectByPath,
    launch: launcher.launch,
    writeExtension: function (browser, isTextTerminal, proxyUrl, socketIoRoute) {
        debug('writing extension');
        // debug('writing extension to chrome browser')
        // get the string bytes for the final extension file
        return extension.setHostAndPath(proxyUrl, socketIoRoute)
            .then(function (str) {
            var extensionDest = getExtensionDir(browser, isTextTerminal);
            var extensionBg = path.join(extensionDest, 'background.js');
            // copy the extension src to the extension dist
            return copyExtension(pathToExtension, extensionDest)
                .then(function () {
                debug('copied extension');
                // and overwrite background.js with the final string bytes
                return fs.writeFileAsync(extensionBg, str);
            })
                .return(extensionDest);
        });
    },
    getBrowsers: function () {
        debug('getBrowsers');
        return launcher.detect()
            .then(function (browsers) {
            if (browsers === void 0) { browsers = []; }
            var majorVersion;
            debug('found browsers %o', { browsers: browsers });
            // @ts-ignore
            var version = process.versions.chrome || '';
            if (version) {
                majorVersion = parseFloat(version.split('.')[0]);
            }
            var electronBrowser = {
                name: 'electron',
                channel: 'stable',
                family: 'chromium',
                displayName: 'Electron',
                version: version,
                path: '',
                majorVersion: majorVersion,
                info: 'Electron is the default browser that comes with Cypress. This is the default browser that runs in headless mode. Selecting this browser is useful when debugging. The version number indicates the underlying Chromium version that Electron uses.',
            };
            // the internal version of Electron, which won't be detected by `launcher`
            debug('adding Electron browser %o', electronBrowser);
            return browsers.concat(electronBrowser);
        });
    },
};
