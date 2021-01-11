"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = __importDefault(require("os"));
const path_1 = require("path");
const ramda_1 = require("ramda");
const lodash_1 = require("lodash");
const errors_1 = require("../errors");
const log_1 = require("../log");
const utils_1 = require("../utils");
function formFullAppPath(name) {
    return [
        `C:/Program Files (x86)/Google/Chrome/Application/${name}.exe`,
        `C:/Program Files/Google/Chrome/Application/${name}.exe`,
    ].map(path_1.normalize);
}
function formChromiumAppPath() {
    const exe = 'C:/Program Files (x86)/Google/chrome-win32/chrome.exe';
    return [path_1.normalize(exe)];
}
function formChromeCanaryAppPath() {
    const home = os_1.default.homedir();
    const exe = path_1.join(home, 'AppData', 'Local', 'Google', 'Chrome SxS', 'Application', 'chrome.exe');
    return [path_1.normalize(exe)];
}
function getFirefoxPaths(editionFolder) {
    return () => {
        return (['Program Files', 'Program Files (x86)'])
            .map((programFiles) => {
            return path_1.normalize(`C:/${programFiles}/${editionFolder}/firefox.exe`);
        })
            .concat(path_1.normalize(path_1.join(os_1.default.homedir(), 'AppData', 'Local', editionFolder, 'firefox.exe')));
    };
}
function formEdgeCanaryAppPath() {
    const home = os_1.default.homedir();
    const exe = path_1.join(home, 'AppData', 'Local', 'Microsoft', 'Edge SxS', 'Application', 'msedge.exe');
    return [path_1.normalize(exe)];
}
const formPaths = {
    chrome: {
        stable: formFullAppPath,
        canary: formChromeCanaryAppPath,
    },
    chromium: {
        stable: formChromiumAppPath,
    },
    firefox: {
        stable: getFirefoxPaths('Mozilla Firefox'),
        dev: getFirefoxPaths('Firefox Developer Edition'),
        nightly: getFirefoxPaths('Firefox Nightly'),
    },
    edge: {
        stable: () => {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')];
        },
        beta: () => {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe')];
        },
        dev: () => {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe')];
        },
        canary: formEdgeCanaryAppPath,
    },
};
function getWindowsBrowser(browser) {
    const getVersion = (stdout) => {
        // result from wmic datafile
        // "Version=61.0.3163.100"
        const wmicVersion = /^Version=(\S+)$/;
        const m = wmicVersion.exec(stdout);
        if (m) {
            return m[1];
        }
        log_1.log('Could not extract version from %s using regex %s', stdout, wmicVersion);
        throw errors_1.notInstalledErr(browser.name);
    };
    const formFullAppPathFn = lodash_1.get(formPaths, [browser.name, browser.channel], formFullAppPath);
    const exePaths = formFullAppPathFn(browser.name);
    log_1.log('looking at possible paths... %o', { browser, exePaths });
    // shift and try paths 1-by-1 until we find one that works
    const tryNextExePath = () => __awaiter(this, void 0, void 0, function* () {
        const exePath = exePaths.shift();
        if (!exePath) {
            // exhausted available paths
            throw errors_1.notInstalledErr(browser.name);
        }
        return fs_extra_1.default.pathExists(exePath)
            .then((exists) => {
            log_1.log('found %s ?', exePath, exists);
            if (!exists) {
                return tryNextExePath();
            }
            return getVersionString(exePath)
                .then(ramda_1.tap(log_1.log))
                .then(getVersion)
                .then((version) => {
                log_1.log('browser %s at \'%s\' version %s', browser.name, exePath, version);
                return {
                    name: browser.name,
                    version,
                    path: exePath,
                };
            });
        })
            .catch((err) => {
            log_1.log('error while looking up exe, trying next exePath %o', { exePath, exePaths, err });
            return tryNextExePath();
        });
    });
    return tryNextExePath();
}
function getVersionString(path) {
    const doubleEscape = (s) => {
        return s.replace(/\\/g, '\\\\');
    };
    // on Windows using "--version" seems to always start the full
    // browser, no matter what one does.
    const args = [
        'datafile',
        'where',
        `name="${doubleEscape(path)}"`,
        'get',
        'Version',
        '/value',
    ];
    return utils_1.utils.execa('wmic', args)
        .then(ramda_1.prop('stdout'))
        .then(ramda_1.trim);
}
exports.getVersionString = getVersionString;
function getVersionNumber(version) {
    if (version.indexOf('Version=') > -1) {
        return version.split('=')[1];
    }
    return version;
}
exports.getVersionNumber = getVersionNumber;
function getPathData(pathStr) {
    const test = new RegExp(/^.+\.exe:(.+)$/);
    const res = test.exec(pathStr);
    let browserKey = '';
    let path = pathStr;
    if (res) {
        const pathParts = path.split(':');
        browserKey = pathParts.pop() || '';
        path = pathParts.join(':');
        return { path, browserKey };
    }
    if (pathStr.indexOf('chrome.exe') > -1) {
        return { path, browserKey: 'chrome' };
    }
    if (pathStr.indexOf('firefox.exe') > -1) {
        return { path, browserKey: 'firefox' };
    }
    return { path };
}
exports.getPathData = getPathData;
function detect(browser) {
    return getWindowsBrowser(browser);
}
exports.detect = detect;
