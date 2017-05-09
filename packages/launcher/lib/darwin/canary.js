"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var path = require("path");
var Promise = require("bluebird");
var canary = {
    version: function (p) {
        return util_1.parse(p, 'KSVersion');
    },
    path: function () { return util_1.find('com.google.Chrome.canary'); },
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
exports.default = canary;
