"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const util_1 = tslib_1.__importDefault(require("util"));
const execAsync = util_1.default.promisify(child_process_1.exec);
/**
 * Returns the total memory limit from the memory cgroup.
 * @returns total memory limit in bytes
 */
const getTotalMemoryLimit = async () => {
    return Number((await execAsync('cat /sys/fs/cgroup/memory/memory.limit_in_bytes', { encoding: 'utf8' })).stdout);
};
/**
 * Convert the raw memory stats into an object.
 * @param rawStats raw memory stats from the memory cgroup
 * @returns object of memory stats
 */
const convertRawStats = (rawStats) => {
    const stats = rawStats.split('\n').filter(Boolean).reduce((acc, arr) => {
        const stat = arr.split(' ');
        acc[stat[0]] = stat[1];
        return acc;
    }, {});
    return stats;
};
/**
 * Returns the available memory from the memory cgroup.
 * @param totalMemoryLimit total memory limit in bytes
 * @param log optional object to add the total memory working set used
 * @returns available memory in bytes
 */
const getAvailableMemory = async (totalMemoryLimit, log) => {
    // retrieve the memory usage and memory stats from the memory cgroup
    const [usageExec, rawStats] = await Promise.all([
        execAsync('cat /sys/fs/cgroup/memory/memory.usage_in_bytes', { encoding: 'utf8' }),
        execAsync('cat /sys/fs/cgroup/memory/memory.stat', { encoding: 'utf8' }),
    ]);
    const stats = convertRawStats(rawStats.stdout);
    const usage = Number(usageExec.stdout);
    // calculate the actual memory used by removing the inactive file cache from the reported usage
    const totalMemoryWorkingSetUsed = (usage - Number(stats.total_inactive_file));
    if (log) {
        log.totalMemoryWorkingSetUsed = totalMemoryWorkingSetUsed;
    }
    // return the available memory by subtracting the used memory from the total memory limit
    return totalMemoryLimit - totalMemoryWorkingSetUsed;
};
exports.default = {
    getTotalMemoryLimit,
    getAvailableMemory,
};
