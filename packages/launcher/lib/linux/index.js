"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("../log");
var ramda_1 = require("ramda");
var errors_1 = require("../errors");
var utils_1 = require("../utils");
var os_1 = __importDefault(require("os"));
var path_1 = __importDefault(require("path"));
var bluebird_1 = __importDefault(require("bluebird"));
function getLinuxBrowser(name, binary, versionRegex) {
    var foundBrowser = {
        name: name,
        path: binary,
    };
    var getVersion = function (stdout) {
        var m = versionRegex.exec(stdout);
        if (m) {
            return m[1];
        }
        log_1.log('Could not extract version from stdout using regex: %o', {
            stdout: stdout,
            versionRegex: versionRegex,
        });
        throw errors_1.notInstalledErr(binary);
    };
    var logAndThrowError = function (err) {
        log_1.log('Received error detecting browser binary: "%s" with error:', binary, err.message);
        throw errors_1.notInstalledErr(binary);
    };
    var maybeSetSnapProfilePath = function (versionString) {
        if (os_1.default.platform() === 'linux' && name === 'chromium' && versionString.endsWith('snap')) {
            // when running as a snap, chromium can only write to certain directories
            // @see https://github.com/cypress-io/cypress/issues/7020
            foundBrowser.profilePath = path_1.default.join(os_1.default.homedir(), 'snap', 'chromium', 'current');
        }
    };
    return getVersionString(binary)
        .tap(maybeSetSnapProfilePath)
        .then(getVersion)
        .then(function (version) {
        foundBrowser.version = version;
        return foundBrowser;
    })
        .catch(logAndThrowError);
}
function getVersionString(path) {
    log_1.log('finding version string using command "%s --version"', path);
    return bluebird_1.default.resolve(utils_1.utils.getOutput(path, ['--version']))
        .timeout(30000, "Timed out after 30 seconds getting browser version for " + path)
        .then(ramda_1.prop('stdout'))
        .then(ramda_1.trim)
        .then(ramda_1.tap(ramda_1.partial(log_1.log, ['stdout: "%s"'])));
}
exports.getVersionString = getVersionString;
function getVersionNumber(version, browser) {
    var regexExec = browser.versionRegex.exec(version);
    return regexExec ? regexExec[1] : version;
}
exports.getVersionNumber = getVersionNumber;
function getPathData(pathStr) {
    return { path: pathStr };
}
exports.getPathData = getPathData;
function detect(browser) {
    return getLinuxBrowser(browser.name, browser.binary, browser.versionRegex);
}
exports.detect = detect;
