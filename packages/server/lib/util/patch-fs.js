"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchFs = void 0;
const tslib_1 = require("tslib");
const graceful_fs_1 = tslib_1.__importDefault(require("graceful-fs"));
function patchFs(_fs) {
    // Add gracefulFs for EMFILE queuing.
    graceful_fs_1.default.gracefulify(_fs);
}
exports.patchFs = patchFs;
