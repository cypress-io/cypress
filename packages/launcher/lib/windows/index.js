"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var fs_extra_1 = __importDefault(require("fs-extra"));
var os_1 = __importDefault(require("os"));
var path_1 = require("path");
var ramda_1 = require("ramda");
var lodash_1 = require("lodash");
var errors_1 = require("../errors");
var log_1 = require("../log");
var utils_1 = require("../utils");
function formFullAppPath(name) {
    return [
        "C:/Program Files (x86)/Google/Chrome/Application/" + name + ".exe",
        "C:/Program Files/Google/Chrome/Application/" + name + ".exe",
    ].map(path_1.normalize);
}
function formChromiumAppPath() {
    var exe = 'C:/Program Files (x86)/Google/chrome-win32/chrome.exe';
    return [path_1.normalize(exe)];
}
function formChromeCanaryAppPath() {
    var home = os_1.default.homedir();
    var exe = path_1.join(home, 'AppData', 'Local', 'Google', 'Chrome SxS', 'Application', 'chrome.exe');
    return [path_1.normalize(exe)];
}
function getFirefoxPaths(editionFolder) {
    return function () {
        return (['Program Files', 'Program Files (x86)'])
            .map(function (programFiles) {
            return path_1.normalize("C:/" + programFiles + "/" + editionFolder + "/firefox.exe");
        })
            .concat(path_1.normalize(path_1.join(os_1.default.homedir(), 'AppData', 'Local', editionFolder, 'firefox.exe')));
    };
}
function formEdgeCanaryAppPath() {
    var home = os_1.default.homedir();
    var exe = path_1.join(home, 'AppData', 'Local', 'Microsoft', 'Edge SxS', 'Application', 'msedge.exe');
    return [path_1.normalize(exe)];
}
var formPaths = {
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
        stable: function () {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')];
        },
        beta: function () {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge Beta/Application/msedge.exe')];
        },
        dev: function () {
            return [path_1.normalize('C:/Program Files (x86)/Microsoft/Edge Dev/Application/msedge.exe')];
        },
        canary: formEdgeCanaryAppPath,
    },
};
function getWindowsBrowser(browser) {
    var _this = this;
    var getVersion = function (stdout) {
        // result from wmic datafile
        // "Version=61.0.3163.100"
        var wmicVersion = /^Version=(\S+)$/;
        var m = wmicVersion.exec(stdout);
        if (m) {
            return m[1];
        }
        log_1.log('Could not extract version from %s using regex %s', stdout, wmicVersion);
        throw errors_1.notInstalledErr(browser.name);
    };
    var formFullAppPathFn = lodash_1.get(formPaths, [browser.name, browser.channel], formFullAppPath);
    var exePaths = formFullAppPathFn(browser.name);
    log_1.log('looking at possible paths... %o', { browser: browser, exePaths: exePaths });
    // shift and try paths 1-by-1 until we find one that works
    var tryNextExePath = function () { return __awaiter(_this, void 0, void 0, function () {
        var exePath;
        return __generator(this, function (_a) {
            exePath = exePaths.shift();
            if (!exePath) {
                // exhausted available paths
                throw errors_1.notInstalledErr(browser.name);
            }
            return [2 /*return*/, fs_extra_1.default.pathExists(exePath)
                    .then(function (exists) {
                    log_1.log('found %s ?', exePath, exists);
                    if (!exists) {
                        return tryNextExePath();
                    }
                    return getVersionString(exePath)
                        .then(ramda_1.tap(log_1.log))
                        .then(getVersion)
                        .then(function (version) {
                        log_1.log('browser %s at \'%s\' version %s', browser.name, exePath, version);
                        return {
                            name: browser.name,
                            version: version,
                            path: exePath,
                        };
                    });
                })
                    .catch(function (err) {
                    log_1.log('error while looking up exe, trying next exePath %o', { exePath: exePath, exePaths: exePaths, err: err });
                    return tryNextExePath();
                })];
        });
    }); };
    return tryNextExePath();
}
function getVersionString(path) {
    var doubleEscape = function (s) {
        return s.replace(/\\/g, '\\\\');
    };
    // on Windows using "--version" seems to always start the full
    // browser, no matter what one does.
    var args = [
        'datafile',
        'where',
        "name=\"" + doubleEscape(path) + "\"",
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
    var test = new RegExp(/^.+\.exe:(.+)$/);
    var res = test.exec(pathStr);
    var browserKey = '';
    var path = pathStr;
    if (res) {
        var pathParts = path.split(':');
        browserKey = pathParts.pop() || '';
        path = pathParts.join(':');
        return { path: path, browserKey: browserKey };
    }
    if (pathStr.indexOf('chrome.exe') > -1) {
        return { path: path, browserKey: 'chrome' };
    }
    if (pathStr.indexOf('firefox.exe') > -1) {
        return { path: path, browserKey: 'firefox' };
    }
    return { path: path };
}
exports.getPathData = getPathData;
function detect(browser) {
    return getWindowsBrowser(browser);
}
exports.detect = detect;
