"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("./util/dom");
var styles_1 = require("./util/styles");
exports.Hooks = {
    beforeEach: function () {
        styles_1.cleanupStyles();
    },
    beforeAll: function () {
        dom_1.renderTargetIfNotExists();
    },
};
