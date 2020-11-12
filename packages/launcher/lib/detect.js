"use strict";
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
var bluebird_1 = __importDefault(require("bluebird"));
var lodash_1 = require("lodash");
var os_1 = __importDefault(require("os"));
var ramda_1 = require("ramda");
var browsers_1 = require("./browsers");
var darwinHelper = __importStar(require("./darwin"));
var errors_1 = require("./errors");
var linuxHelper = __importStar(require("./linux"));
var log_1 = require("./log");
var windowsHelper = __importStar(require("./windows"));
exports.setMajorVersion = function (browser) {
    var majorVersion = browser.majorVersion;
    if (browser.version) {
        majorVersion = browser.version.split('.')[0];
        log_1.log('browser %s version %s major version %s', browser.name, browser.version, majorVersion);
        if (majorVersion) {
            majorVersion = parseInt(majorVersion);
        }
    }
    return lodash_1.extend({}, browser, { majorVersion: majorVersion });
};
var helpers = {
    darwin: darwinHelper,
    linux: linuxHelper,
    win32: windowsHelper,
};
function getHelper(platform) {
    return helpers[platform || os_1.default.platform()];
}
function lookup(platform, browser) {
    log_1.log('looking up %s on %s platform', browser.name, platform);
    var helper = getHelper(platform);
    if (!helper) {
        throw new Error("Cannot lookup browser " + browser.name + " on " + platform);
    }
    return helper.detect(browser);
}
/**
 * Try to detect a single browser definition, which may dispatch multiple `checkOneBrowser` calls,
 * one for each binary. If Windows is detected, only one `checkOneBrowser` will be called, because
 * we don't use the `binary` field on Windows.
 */
function checkBrowser(browser) {
    if (Array.isArray(browser.binary) && os_1.default.platform() !== 'win32') {
        return bluebird_1.default.map(browser.binary, function (binary) {
            return checkOneBrowser(lodash_1.extend({}, browser, { binary: binary }));
        });
    }
    return bluebird_1.default.map([browser], checkOneBrowser);
}
function checkOneBrowser(browser) {
    var platform = os_1.default.platform();
    var pickBrowserProps = ramda_1.pick([
        'name',
        'family',
        'channel',
        'displayName',
        'type',
        'version',
        'path',
        'profilePath',
        'custom',
        'warning',
        'info',
    ]);
    var logBrowser = function (props) {
        log_1.log('setting major version for %j', props);
    };
    var failed = function (err) {
        if (err.notInstalled) {
            log_1.log('browser %s not installed', browser.name);
            return false;
        }
        throw err;
    };
    log_1.log('checking one browser %s', browser.name);
    return lookup(platform, browser)
        .then(ramda_1.merge(browser))
        .then(pickBrowserProps)
        .then(ramda_1.tap(logBrowser))
        .then(function (browser) { return exports.setMajorVersion(browser); })
        .then(maybeSetFirefoxWarning)
        .catch(failed);
}
exports.firefoxGcWarning = 'This version of Firefox has a bug that causes excessive memory consumption and will cause your tests to run slowly. It is recommended to upgrade to Firefox 80 or newer. [Learn more.](https://docs.cypress.io/guides/references/configuration.html#firefoxGcInterval)';
// @see https://github.com/cypress-io/cypress/issues/8241
var maybeSetFirefoxWarning = function (browser) {
    if (browser.family === 'firefox' && Number(browser.majorVersion) < 80) {
        browser.warning = exports.firefoxGcWarning;
    }
    return browser;
};
/** returns list of detected browsers */
exports.detect = function (goalBrowsers) {
    // we can detect same browser under different aliases
    // tell them apart by the name and the version property
    if (!goalBrowsers) {
        goalBrowsers = browsers_1.browsers;
    }
    var removeDuplicates = ramda_1.uniqBy(function (browser) {
        return ramda_1.props(['name', 'version'], browser);
    });
    var compactFalse = function (browsers) {
        return lodash_1.compact(browsers);
    };
    log_1.log('detecting if the following browsers are present %o', goalBrowsers);
    return bluebird_1.default.mapSeries(goalBrowsers, checkBrowser)
        .then(ramda_1.flatten)
        .then(compactFalse)
        .then(removeDuplicates);
};
exports.detectByPath = function (path, goalBrowsers) {
    if (!goalBrowsers) {
        goalBrowsers = browsers_1.browsers;
    }
    var helper = getHelper();
    var detectBrowserByVersionString = function (stdout) {
        return lodash_1.find(goalBrowsers, function (goalBrowser) {
            return goalBrowser.versionRegex.test(stdout);
        });
    };
    var detectBrowserFromKey = function (browserKey) {
        return lodash_1.find(goalBrowsers, function (goalBrowser) {
            return (goalBrowser.name === browserKey ||
                goalBrowser.displayName === browserKey ||
                goalBrowser.binary.indexOf(browserKey) > -1);
        });
    };
    var setCustomBrowserData = function (browser, path, versionStr) {
        var version = helper.getVersionNumber(versionStr, browser);
        var parsedBrowser = {
            name: browser.name,
            displayName: "Custom " + browser.displayName,
            info: "Loaded from " + path,
            custom: true,
            path: path,
            version: version,
        };
        parsedBrowser = exports.setMajorVersion(parsedBrowser);
        return lodash_1.extend({}, browser, parsedBrowser);
    };
    var pathData = helper.getPathData(path);
    return helper.getVersionString(pathData.path)
        .then(function (version) {
        var browser;
        if (pathData.browserKey) {
            browser = detectBrowserFromKey(pathData.browserKey);
        }
        if (!browser) {
            browser = detectBrowserByVersionString(version);
        }
        if (!browser) {
            throw errors_1.notDetectedAtPathErr("Unable to find browser with path " + path);
        }
        return setCustomBrowserData(browser, pathData.path, version);
    })
        .then(maybeSetFirefoxWarning)
        .catch(function (err) {
        if (err.notDetectedAtPath) {
            throw err;
        }
        throw errors_1.notDetectedAtPathErr(err.message);
    });
};
