"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var canary_1 = require("./canary");
var chrome_1 = require("./chrome");
// import chromium from './chromium'
// import chromium from './chrome'
// module.exports = {
//   'chrome':   require(),
//   'canary':   require('./canary'),
//   'chromium': require('./chromium')
// }
exports.default = {
    chrome: chrome_1.default,
    canary: canary_1.default
    // chromium
};
