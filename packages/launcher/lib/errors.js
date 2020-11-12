"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notInstalledErr = function (name, message) {
    var err = new Error(message || "Browser not installed: " + name);
    err.notInstalled = true;
    return err;
};
exports.notDetectedAtPathErr = function (stdout) {
    var err = new Error(stdout);
    err.notDetectedAtPath = true;
    return err;
};
