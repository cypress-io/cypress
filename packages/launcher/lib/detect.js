"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var linux_1 = require("./linux");
var _ = require("lodash");
var os = require("os");
var Promise = require("bluebird");
var darwin = require("./darwin/index");
var browsers = [
    {
        name: 'chrome',
        re: /Google Chrome (\S+)/,
        profile: true,
        binary: 'google-chrome',
        executable: 'Contents/MacOS/Google Chrome'
    }, {
        name: 'chromium',
        re: /Chromium (\S+)/,
        profile: true,
        binary: 'chromium-browser',
        executable: 'Contents/MacOS/Chromium'
    }, {
        name: 'canary',
        re: /Google Chrome Canary (\S+)/,
        profile: true,
        binary: 'google-chrome-canary',
        executable: 'Contents/MacOS/Google Chrome Canary'
    }
];
var setMajorVersion = function (obj) {
    obj.majorVersion = obj.version.split('.')[0];
    return obj;
};
function lookup(platform, obj) {
    switch (platform) {
        case 'darwin':
            var fn = darwin[obj.name];
            if (fn) {
                return fn.get(obj.executable);
            }
            var err = new Error("Browser not installed: " + obj.name);
            err.notInstalled = true;
            return Promise.reject(err);
        case 'linux':
            return linux_1.linuxBrowser.get(obj.binary, obj.re);
    }
}
function checkOneBrowser(browser) {
    var platform = os.platform();
    return lookup(platform, browser)
        .then(function (props) {
        return _.chain({})
            .extend(browser, props)
            .pick('name', 'type', 'version', 'path')
            .value();
    })
        .then(setMajorVersion)
        .catch(function (err) {
        if (err.notInstalled) {
            return false;
        }
        throw err;
    });
}
module.exports = function () {
    return Promise.map(browsers, checkOneBrowser)
        .then(_.compact);
};
