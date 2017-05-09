"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var cp = require("child_process");
var browserNotFoundErr = function (browsers, name) {
    var available = _.map(browsers, 'name').join(', ');
    var err = new Error("Browser: '" + name + "' not found. Available browsers are: [" + available + "]");
    err.specificBrowserNotFound = true;
    return err;
};
module.exports = {
    launch: function (browsers, name, url, args) {
        if (args === void 0) { args = []; }
        var browser = _.find(browsers, { name: name });
        if (!browser) {
            throw browserNotFoundErr(browsers, name);
        }
        if (url) {
            args.unshift(url);
        }
        return cp.spawn(browser.path, args, { stdio: 'ignore' });
    }
};
