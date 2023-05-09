"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = (0, debug_1.default)('cypress:server:unhandled_exceptions');
function handle(shouldExitCb) {
    function globalExceptionHandler(err) {
        if (shouldExitCb && !shouldExitCb(err)) {
            debug('suppressing unhandled exception, not exiting %o', { err });
            handle(shouldExitCb);
            return;
        }
        process.exitCode = 1;
        return require('./errors').logException(err)
            .then(() => {
            process.exit(1);
        });
    }
    process.removeAllListeners('unhandledRejection');
    // @ts-expect-error missing unhandledRejection here
    process.once('unhandledRejection', globalExceptionHandler);
    process.removeAllListeners('uncaughtException');
    process.once('uncaughtException', globalExceptionHandler);
}
exports.handle = handle;
