"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runner = void 0;
const tslib_1 = require("tslib");
const send_1 = tslib_1.__importDefault(require("send"));
const resolve_dist_1 = require("@packages/resolve-dist");
exports.runner = {
    handle(req, res) {
        const pathToFile = (0, resolve_dist_1.getPathToDist)('runner', req.params[0]);
        return (0, send_1.default)(req, pathToFile).pipe(res);
    },
};
