"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var path = require("path");
var Promise = require("bluebird");
var chromium = {
    version: function (p) {
        return util_1.parse(p, 'CFBundleShortVersionString');
    },
    path: function () {
        return util_1.find('org.chromium.Chromium');
    },
    get: function (executable) {
        var _this = this;
        return this.path()
            .then(function (p) {
            return Promise.props({
                path: path.join(p, executable),
                version: _this.version(p)
            });
        });
    }
};
exports.default = chromium;
