"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var os = require("os");
var Promise = require("bluebird");
var linux = require("./linux");
var darwin = require("./darwin");
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
            else {
                var err = new Error('Browser not installed: #{obj.name}');
                err.notInstalled = true;
                Promise.reject(err);
            }
            break;
        case 'linux':
            return linux.get(obj.binary, obj.re);
    }
}
module.exports = function () {
    var platform = os.platform();
    return Promise.map(browsers, function (obj) {
        return lookup(platform, obj)
            .then(function (props) {
            return _.chain({})
                .extend(obj, props)
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
    }).then(_.compact);
};
