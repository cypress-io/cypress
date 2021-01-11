"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const linuxHelper = __importStar(require("../linux"));
const log_1 = require("../log");
const ramda_1 = require("ramda");
const lodash_1 = require("lodash");
exports.browsers = {
    chrome: {
        stable: {
            appName: 'Google Chrome.app',
            executable: 'Contents/MacOS/Google Chrome',
            appId: 'com.google.Chrome',
            versionProperty: 'KSVersion',
        },
        canary: {
            appName: 'Google Chrome Canary.app',
            executable: 'Contents/MacOS/Google Chrome Canary',
            appId: 'com.google.Chrome.canary',
            versionProperty: 'KSVersion',
        },
    },
    chromium: {
        stable: {
            appName: 'Chromium.app',
            executable: 'Contents/MacOS/Chromium',
            appId: 'org.chromium.Chromium',
            versionProperty: 'CFBundleShortVersionString',
        },
    },
    firefox: {
        stable: {
            appName: 'Firefox.app',
            executable: 'Contents/MacOS/firefox-bin',
            appId: 'org.mozilla.firefox',
            versionProperty: 'CFBundleShortVersionString',
        },
        dev: {
            appName: 'Firefox Developer Edition.app',
            executable: 'Contents/MacOS/firefox-bin',
            appId: 'org.mozilla.firefoxdeveloperedition',
            versionProperty: 'CFBundleShortVersionString',
        },
        nightly: {
            appName: 'Firefox Nightly.app',
            executable: 'Contents/MacOS/firefox-bin',
            appId: 'org.mozilla.nightly',
            versionProperty: 'CFBundleShortVersionString',
        },
    },
    edge: {
        stable: {
            appName: 'Microsoft Edge.app',
            executable: 'Contents/MacOS/Microsoft Edge',
            appId: 'com.microsoft.Edge',
            versionProperty: 'CFBundleShortVersionString',
        },
        canary: {
            appName: 'Microsoft Edge Canary.app',
            executable: 'Contents/MacOS/Microsoft Edge Canary',
            appId: 'com.microsoft.Edge.Canary',
            versionProperty: 'CFBundleShortVersionString',
        },
        beta: {
            appName: 'Microsoft Edge Beta.app',
            executable: 'Contents/MacOS/Microsoft Edge Beta',
            appId: 'com.microsoft.Edge.Beta',
            versionProperty: 'CFBundleShortVersionString',
        },
        dev: {
            appName: 'Microsoft Edge Dev.app',
            executable: 'Contents/MacOS/Microsoft Edge Dev',
            appId: 'com.microsoft.Edge.Dev',
            versionProperty: 'CFBundleShortVersionString',
        },
    },
};
exports.getVersionString = linuxHelper.getVersionString;
exports.getVersionNumber = linuxHelper.getVersionNumber;
exports.getPathData = linuxHelper.getPathData;
function detect(browser) {
    let findAppParams = lodash_1.get(exports.browsers, [browser.name, browser.channel]);
    if (!findAppParams) {
        // ok, maybe it is custom alias?
        log_1.log('detecting custom browser %s on darwin', browser.name);
        return linuxHelper.detect(browser);
    }
    return util_1.findApp(findAppParams)
        .then(ramda_1.merge({ name: browser.name }))
        .catch(() => {
        log_1.log('could not detect %s using traditional Mac methods', browser.name);
        log_1.log('trying linux search');
        return linuxHelper.detect(browser);
    });
}
exports.detect = detect;
