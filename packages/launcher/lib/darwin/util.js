"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var cp = require("child_process");
var path = require("path");
var plist = require("plist");
var Promise = require("bluebird");
var execAsync = Promise.promisify(cp.exec);
function parse(p, prop) {
    var pl = path.join(p, 'Contents', 'Info.plist');
    return fs.readFile(pl, 'utf8')
        .then(function (str) {
        return plist.parse(str).get(prop);
    }).catch(function () {
        var err = new Error("Info.plist not found: " + pl);
        err.notInstalled = true;
        throw err;
    });
}
exports.parse = parse;
function find(id) {
    var cmd = "mdfind 'kMDItemCFBundleIdentifier=='" + id + "'' | head -1";
    return execAsync(cmd)
        .call('trim')
        .then(function (str) {
        if (str === '') {
            var err = new Error("Browser not installed: " + id);
            err.notInstalled = true;
            throw err;
        }
        return str;
    });
}
exports.find = find;
