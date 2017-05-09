"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var Promise = require('bluebird');
var detect = require('./detect');
var browsers = require('./browsers');
var missingConfig = function () {
    return Promise.reject(new Error('You must provide a path to a config file.'));
};
var wrap = function (all) { return ({
    launch: function (name, url, args) {
        if (args === void 0) { args = []; }
        return browsers.launch(all, name, url, args);
    }
}); };
var init = function (browsers) {
    return browsers ? wrap(browsers) : detect().then(wrap);
};
var update = function (pathToConfig) {
    if (!pathToConfig) {
        return missingConfig();
    }
    // detect the browsers and set the config
    var saveBrowsers = function (browers) {
        return fs.writeJson(pathToConfig, browers, { spaces: 2 });
    };
    return detect()
        .then(saveBrowsers);
};
var launcher = {
    init: init,
    update: update,
    detect: detect
};
module.exports = launcher;
