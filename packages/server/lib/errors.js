"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripAnsi = exports.cloneErr = exports.throwErr = exports.warning = exports.log = exports.get = exports.logException = void 0;
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const errors_1 = tslib_1.__importDefault(require("@packages/errors"));
const exception_1 = tslib_1.__importDefault(require("./cloud/exception"));
const isProduction = () => {
    return process.env['CYPRESS_INTERNAL_ENV'] === 'production';
};
exports.logException = bluebird_1.default.method(function (err) {
    // TODO: remove context here
    if (this.log(err) && isProduction()) {
        // log this exception since
        // its not a known error
        return exception_1.default
            .create(err)
            .catch(() => { });
    }
    return;
});
exports.get = errors_1.default.get;
exports.log = errors_1.default.log;
exports.warning = errors_1.default.warning;
exports.throwErr = errors_1.default.throwErr;
exports.cloneErr = errors_1.default.cloneErr;
exports.stripAnsi = errors_1.default.stripAnsi;
