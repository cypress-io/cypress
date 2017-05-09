"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cp = require("child_process");
var Promise = require("bluebird");
var execAsync = Promise.promisify(cp.exec);
var notInstalledErr = function (name) {
    var err = new Error('Browser not installed: #{name}');
    err.notInstalled = true;
    throw err;
};
exports.linuxBrowser = {
    get: function (binary, re) {
        return execAsync(binary + " --version")
            .call('trim')
            .then(function (stdout) {
            var m = re.exec(stdout);
            if (m) {
                return {
                    path: binary,
                    version: m[1]
                };
            }
            else {
                notInstalledErr(binary);
            }
        })
            .catch(function (e) { return notInstalledErr(binary); });
    }
};
