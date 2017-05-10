"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("./log");
var lodash_1 = require("lodash");
var cp = require("child_process");
var browserNotFoundErr = function (browsers, name) {
    var available = lodash_1.map(browsers, 'name').join(', ');
    var err = new Error("Browser: '" + name + "' not found. Available browsers are: [" + available + "]");
    err.specificBrowserNotFound = true;
    return err;
};
/** starts a browser by name and opens URL if given one */
function launch(browsers, name, url, args) {
    if (args === void 0) { args = []; }
    log_1.log('launching browser %s to open %s', name, url);
    var browser = lodash_1.find(browsers, { name: name });
    if (!browser) {
        throw browserNotFoundErr(browsers, name);
    }
    if (url) {
        args.unshift(url);
    }
    return cp.spawn(browser.path, args, { stdio: 'ignore' });
}
exports.launch = launch;
