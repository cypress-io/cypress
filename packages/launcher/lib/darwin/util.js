"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("../log");
var execa = require("execa");
var fs = require("fs-extra");
var path = require("path");
var plist = require("plist");
console.log('plist', plist);
function parse(p, prop) {
    var pl = path.join(p, 'Contents', 'Info.plist');
    return fs.readFile(pl, 'utf8')
        .then(function (str) { return plist.parse(str); })
        .then(function (x) { return x[prop]; })
        .catch(function (e) {
        var msg = "Info.plist not found: " + pl + "\n      " + e.message;
        var err = new Error(msg);
        err.notInstalled = true;
        throw err;
    });
}
exports.parse = parse;
function find(id) {
    var cmd = "mdfind 'kMDItemCFBundleIdentifier==\"" + id + "\"' | head -1";
    log_1.log('looking for bundle id %s using command: %s', id, cmd);
    return execa.shell(cmd)
        .then(function (result) { return result.stdout; })
        .then(function (str) {
        log_1.log('found %s at %s', id, str);
        return str;
    })
        .catch(function () {
        log_1.log('could not find %s', id);
        var err = new Error("Browser not installed: " + id);
        err.notInstalled = true;
        throw err;
    });
}
exports.find = find;
