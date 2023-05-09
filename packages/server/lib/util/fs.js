"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fs = void 0;
const tslib_1 = require("tslib");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
exports.fs = bluebird_1.default.promisifyAll(fs_extra_1.default);
