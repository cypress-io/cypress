"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const os_1 = tslib_1.__importDefault(require("os"));
const systeminformation_1 = tslib_1.__importDefault(require("systeminformation"));
/**
 * Returns the total memory limit in bytes.
 * @returns total memory limit in bytes
 */
const getTotalMemoryLimit = async () => {
    return os_1.default.totalmem();
};
/**
 * Returns the available memory in bytes.
 * @param totalMemoryLimit total memory limit in bytes
 * @param log optional object to add any additional information
 * @returns available memory in bytes
 */
const getAvailableMemory = async (totalMemoryLimit, log) => {
    return (await systeminformation_1.default.mem()).available;
};
exports.default = {
    getTotalMemoryLimit,
    getAvailableMemory,
};
