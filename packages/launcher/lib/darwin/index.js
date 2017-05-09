"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canary_1 = require("./canary");
var chrome_1 = require("./chrome");
var chromium_1 = require("./chromium");
var browsers = {
    chrome: chrome_1.default,
    canary: canary_1.default,
    chromium: chromium_1.default
};
exports.default = browsers;
