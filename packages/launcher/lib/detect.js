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
const bluebird_1 = __importDefault(require("bluebird"));
const lodash_1 = require("lodash");
const os_1 = __importDefault(require("os"));
const ramda_1 = require("ramda");
const browsers_1 = require("./browsers");
const darwinHelper = __importStar(require("./darwin"));
const errors_1 = require("./errors");
const linuxHelper = __importStar(require("./linux"));
const log_1 = require("./log");
const windowsHelper = __importStar(require("./windows"));
exports.setMajorVersion = (browser) => {
    let majorVersion = browser.majorVersion;
    if (browser.version) {
        majorVersion = browser.version.split('.')[0];
        log_1.log('browser %s version %s major version %s', browser.name, browser.version, majorVersion);
        if (majorVersion) {
            majorVersion = parseInt(majorVersion);
        }
    }
    return lodash_1.extend({}, browser, { majorVersion });
};
const helpers = {
    darwin: darwinHelper,
    linux: linuxHelper,
    win32: windowsHelper,
};
function getHelper(platform) {
    return helpers[platform || os_1.default.platform()];
}
function lookup(platform, browser) {
    log_1.log('looking up %s on %s platform', browser.name, platform);
    const helper = getHelper(platform);
    if (!helper) {
        throw new Error(`Cannot lookup browser ${browser.name} on ${platform}`);
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
        return bluebird_1.default.map(browser.binary, (binary) => {
            return checkOneBrowser(lodash_1.extend({}, browser, { binary }));
        });
    }
    return bluebird_1.default.map([browser], checkOneBrowser);
}
function checkOneBrowser(browser) {
    const platform = os_1.default.platform();
    const pickBrowserProps = ramda_1.pick([
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
    const logBrowser = (props) => {
        log_1.log('setting major version for %j', props);
    };
    const failed = (err) => {
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
        .then((browser) => exports.setMajorVersion(browser))
        .then(maybeSetFirefoxWarning)
        .catch(failed);
}
exports.firefoxGcWarning = 'This version of Firefox has a bug that causes excessive memory consumption and will cause your tests to run slowly. It is recommended to upgrade to Firefox 80 or newer. [Learn more.](https://docs.cypress.io/guides/references/configuration.html#firefoxGcInterval)';
// @see https://github.com/cypress-io/cypress/issues/8241
const maybeSetFirefoxWarning = (browser) => {
    if (browser.family === 'firefox' && Number(browser.majorVersion) < 80) {
        browser.warning = exports.firefoxGcWarning;
    }
    return browser;
};
/** returns list of detected browsers */
exports.detect = (goalBrowsers) => {
    // we can detect same browser under different aliases
    // tell them apart by the name and the version property
    if (!goalBrowsers) {
        goalBrowsers = browsers_1.browsers;
    }
    const removeDuplicates = ramda_1.uniqBy((browser) => {
        return ramda_1.props(['name', 'version'], browser);
    });
    const compactFalse = (browsers) => {
        return lodash_1.compact(browsers);
    };
    log_1.log('detecting if the following browsers are present %o', goalBrowsers);
    return bluebird_1.default.mapSeries(goalBrowsers, checkBrowser)
        .then(ramda_1.flatten)
        .then(compactFalse)
        .then(removeDuplicates);
};
exports.detectByPath = (path, goalBrowsers) => {
    if (!goalBrowsers) {
        goalBrowsers = browsers_1.browsers;
    }
    const helper = getHelper();
    const detectBrowserByVersionString = (stdout) => {
        return lodash_1.find(goalBrowsers, (goalBrowser) => {
            return goalBrowser.versionRegex.test(stdout);
        });
    };
    const detectBrowserFromKey = (browserKey) => {
        return lodash_1.find(goalBrowsers, (goalBrowser) => {
            return (goalBrowser.name === browserKey ||
                goalBrowser.displayName === browserKey ||
                goalBrowser.binary.indexOf(browserKey) > -1);
        });
    };
    const setCustomBrowserData = (browser, path, versionStr) => {
        const version = helper.getVersionNumber(versionStr, browser);
        let parsedBrowser = {
            name: browser.name,
            displayName: `Custom ${browser.displayName}`,
            info: `Loaded from ${path}`,
            custom: true,
            path,
            version,
        };
        parsedBrowser = exports.setMajorVersion(parsedBrowser);
        return lodash_1.extend({}, browser, parsedBrowser);
    };
    const pathData = helper.getPathData(path);
    return helper.getVersionString(pathData.path)
        .then((version) => {
        let browser;
        if (pathData.browserKey) {
            browser = detectBrowserFromKey(pathData.browserKey);
        }
        if (!browser) {
            browser = detectBrowserByVersionString(version);
        }
        if (!browser) {
            throw errors_1.notDetectedAtPathErr(`Unable to find browser with path ${path}`);
        }
        return setCustomBrowserData(browser, pathData.path, version);
    })
        .then(maybeSetFirefoxWarning)
        .catch((err) => {
        if (err.notDetectedAtPath) {
            throw err;
        }
        throw errors_1.notDetectedAtPathErr(err.message);
    });
};
