"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMemoryStats = exports.getAvailableMemory = exports.getRendererMemoryUsage = exports.getMemoryHandler = exports.getJsHeapSizeLimit = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const systeminformation_1 = tslib_1.__importDefault(require("systeminformation"));
const os_1 = tslib_1.__importDefault(require("os"));
const fs_extra_1 = tslib_1.__importDefault(require("fs-extra"));
const perf_hooks_1 = require("perf_hooks");
const path_1 = tslib_1.__importDefault(require("path"));
const pidusage_1 = tslib_1.__importDefault(require("pidusage"));
const process_profiler_1 = require("../../util/process_profiler");
const __1 = tslib_1.__importDefault(require(".."));
const debug = (0, debug_1.default)('cypress:server:browsers:memory');
const debugVerbose = (0, debug_1.default)('cypress-verbose:server:browsers:memory');
const MEMORY_THRESHOLD_PERCENTAGE = Number(process.env.CYPRESS_INTERNAL_MEMORY_THRESHOLD_PERCENTAGE) || 50;
const MEMORY_PROFILER_INTERVAL = Number(process.env.CYPRESS_INTERNAL_MEMORY_PROFILER_INTERVAL) || 1000;
const MEMORY_FOLDER = process.env.CYPRESS_INTERNAL_MEMORY_FOLDER_PATH || path_1.default.join('cypress', 'logs', 'memory');
const CYPRESS_INTERNAL_MEMORY_SAVE_STATS = process.env.CYPRESS_INTERNAL_MEMORY_SAVE_STATS || 'false';
const SAVE_MEMORY_STATS = ['1', 'true'].includes(CYPRESS_INTERNAL_MEMORY_SAVE_STATS.toLowerCase());
const CYPRESS_INTERNAL_MEMORY_SKIP_GC = process.env.CYPRESS_INTERNAL_MEMORY_SKIP_GC || 'false';
const SKIP_GC = ['1', 'true'].includes(CYPRESS_INTERNAL_MEMORY_SKIP_GC.toLowerCase());
const KIBIBYTE = 1024;
const FOUR_GIBIBYTES = 4 * (KIBIBYTE ** 3);
let rendererProcess;
let handler;
let totalMemoryLimit;
let jsHeapSizeLimit;
let browserInstance = null;
let started = false;
let cumulativeStats = [];
let collectGarbageOnNextTest = false;
let timer;
let currentSpecFileName;
let statsLog = {};
let gcLog = {};
/**
 * Algorithm:
 *
 * When the spec run starts:
 *   1. set total mem limit for the container/host by reading off cgroup memory limits (if available) otherwise use os.totalmem()
 *   2. set js heap size limit by reading off the browser
 *   3. turn on memory profiler
 *
 * On a defined interval (e.g. 1s):
 *   1. set current mem available for the container/host by reading off cgroup memory usage (if available) otherwise use si.mem().available
 *   2. set current renderer mem usage
 *   3. set max avail render mem to minimum of v8 heap size limit and total available mem (current available mem + current renderer mem usage)
 *   4. calc % of memory used, current renderer mem usage / max avail render mem
 *
 * Before each test:
 *   1. if any interval exceeded the defined memory threshold (e.g. 50%), do a GC
 *
 * After the spec run ends:
 *   1. turn off memory profiler
 */
/**
 * Returns a function that wraps the provided function and measures the duration of the function.
 * @param func the function to time
 * @param opts name of the function to time and whether to save the result to the log
 * @returns a function that wraps the provided function and measures the duration of the function
 */
const measure = (func, opts = { save: true }) => {
    return async (...args) => {
        const start = perf_hooks_1.performance.now();
        const result = await func.apply(this, args);
        const duration = perf_hooks_1.performance.now() - start;
        const name = opts.name || func.name;
        if (opts === null || opts === void 0 ? void 0 : opts.save) {
            if (name === 'checkMemoryPressure') {
                gcLog[`${name}Duration`] = duration;
            }
            else {
                statsLog[`${name}Duration`] = duration;
            }
        }
        else {
            debugVerbose('%s took %dms', name, duration);
        }
        return result;
    };
};
/**
 * Retrieves the JS heap size limit for the browser.
 * @param automation - the automation client to use
 * @returns the JS heap size limit in bytes for the browser. If not available, returns a default of four gibibytes.
 */
exports.getJsHeapSizeLimit = measure(async (automation) => {
    let heapLimit;
    try {
        heapLimit = (await automation.request('get:heap:size:limit', null, null)).result.value;
    }
    catch (err) {
        debug('could not get jsHeapSizeLimit from browser, using default of four gibibytes');
        heapLimit = FOUR_GIBIBYTES;
    }
    return heapLimit;
}, { name: 'getJsHeapSizeLimit', save: false });
/**
 * @returns the memory handler to use based on the platform and if linux, the cgroup version
 */
const getMemoryHandler = async () => {
    if (os_1.default.platform() === 'linux') {
        if (await fs_extra_1.default.pathExists('/sys/fs/cgroup/cgroup.controllers')) {
            // cgroup v2 can use the default handler so just pass through
        }
        else {
            debug('using cgroup v1 memory handler');
            return (await Promise.resolve().then(() => tslib_1.__importStar(require('./cgroup-v1')))).default;
        }
    }
    debug('using default memory handler');
    return (await Promise.resolve().then(() => tslib_1.__importStar(require('./default')))).default;
};
exports.getMemoryHandler = getMemoryHandler;
/**
 * Attempts to find the browser's renderer process running the Cypress tests.
 * @param processes - all of the system processes
 * @returns the renderer process or null if there is no renderer process
 */
const findRendererProcess = (processes) => {
    // group the processes by their group (e.g. browser, cypress, launchpad, etc...)
    const groupedProcesses = (0, process_profiler_1.groupCyProcesses)(processes);
    // filter down to the renderer processes by looking at the 'browser' group and the command/params with type renderer
    const browserProcesses = groupedProcesses.filter((p) => p.group === 'browser');
    // if we only have one browser process assume it's the renderer process, otherwise filter down to the renderer processes
    const rendererProcesses = browserProcesses.length === 1 ? browserProcesses : browserProcesses.filter((p) => { var _a, _b; return p.group === 'browser' && (((_a = p.command) === null || _a === void 0 ? void 0 : _a.includes('--type=renderer')) || ((_b = p.params) === null || _b === void 0 ? void 0 : _b.includes('--type=renderer'))); });
    // if there are no renderer processes, return null
    if (rendererProcesses.length === 0)
        return null;
    // assume the renderer process with the most memory is the one we're interested in
    const maxRendererProcess = rendererProcesses.reduce((prev, current) => (prev.memRss > current.memRss) ? prev : current);
    debugVerbose('renderer processes found: %o', maxRendererProcess);
    return maxRendererProcess;
};
/**
 * Retrieves the memory usage for the renderer process.
 * @returns the memory usage in bytes for the renderer process or null if there is no renderer process
 */
exports.getRendererMemoryUsage = measure(async () => {
    // if we don't have a renderer process yet, find it.
    // this is done once since the renderer process will not change
    if (!rendererProcess) {
        let process = null;
        let processes;
        try {
            processes = await systeminformation_1.default.processes();
        }
        catch (err) {
            debug('could not get processes to find renderer process: %o', err);
            return null;
        }
        process = findRendererProcess(processes);
        if (!process)
            return null;
        // if we found a renderer process, save it so we don't have to find it again
        rendererProcess = process;
        // return the memory usage for the renderer process
        return rendererProcess.memRss * KIBIBYTE;
    }
    try {
        // if we have a renderer process, get the memory usage for it
        return (await (0, pidusage_1.default)(rendererProcess.pid)).memory;
    }
    catch (_a) {
        // if we can't get the memory usage for the renderer process,
        // assume it's gone and clear it out so we can find it again
        rendererProcess = null;
        return (0, exports.getRendererMemoryUsage)();
    }
}, { name: 'getRendererMemoryUsage', save: true });
/**
 * Retrieves the available memory for the container/host.
 * @returns the available memory in bytes for the container/host
 */
exports.getAvailableMemory = measure(() => {
    return handler.getAvailableMemory(totalMemoryLimit, statsLog);
}, { name: 'getAvailableMemory', save: true });
/**
 * Calculates the memory stats used to determine if garbage collection should be run before the next test starts.
 */
exports.calculateMemoryStats = measure(async () => {
    // retrieve the available memory and the renderer process memory usage
    const [currentAvailableMemory, rendererProcessMemRss] = await Promise.all([
        (0, exports.getAvailableMemory)(),
        (0, exports.getRendererMemoryUsage)(),
    ]);
    if (rendererProcessMemRss === null) {
        debug('no renderer process found, skipping memory stat collection');
        return;
    }
    // the max available memory is the minimum of the js heap size limit and
    // the current available memory plus the renderer process memory usage
    const maxAvailableRendererMemory = Math.min(jsHeapSizeLimit, currentAvailableMemory + rendererProcessMemRss);
    const rendererUsagePercentage = (rendererProcessMemRss / maxAvailableRendererMemory) * 100;
    // if the renderer's memory is above the MEMORY_THRESHOLD_PERCENTAGE, we should collect garbage on the next test
    const shouldCollectGarbage = rendererUsagePercentage >= MEMORY_THRESHOLD_PERCENTAGE && !SKIP_GC;
    // if we should collect garbage, set the flag to true so we can collect garbage on the next test
    collectGarbageOnNextTest = collectGarbageOnNextTest || shouldCollectGarbage;
    // set all the memory stats on the stats log
    statsLog.jsHeapSizeLimit = jsHeapSizeLimit;
    statsLog.totalMemoryLimit = totalMemoryLimit;
    statsLog.rendererProcessMemRss = rendererProcessMemRss;
    statsLog.rendererUsagePercentage = rendererUsagePercentage;
    statsLog.rendererMemoryThreshold = maxAvailableRendererMemory * (MEMORY_THRESHOLD_PERCENTAGE / 100);
    statsLog.currentAvailableMemory = currentAvailableMemory;
    statsLog.maxAvailableRendererMemory = maxAvailableRendererMemory;
    statsLog.shouldCollectGarbage = shouldCollectGarbage;
    statsLog.timestamp = Date.now();
}, { name: 'calculateMemoryStats', save: true });
/**
 * Collects garbage if needed and logs the test information.
 * @param automation - the automation client used to collect garbage
 * @param test - the current test
 */
const checkMemoryPressureAndLog = async ({ automation, test }) => {
    await checkMemoryPressure(automation);
    gcLog.testTitle = test.title;
    gcLog.testOrder = Number(`${test.order}.${test.currentRetry}`);
    gcLog.garbageCollected = collectGarbageOnNextTest;
    gcLog.timestamp = Date.now();
    addCumulativeStats(gcLog);
    gcLog = {};
    // clear the flag so we don't collect garbage on every test
    collectGarbageOnNextTest = false;
};
/**
 * Collects the browser's garbage if it previously exceeded the threshold when it was measured.
 * @param automation the automation client used to collect garbage
 */
const checkMemoryPressure = measure(async (automation) => {
    if (collectGarbageOnNextTest) {
        debug('forcing garbage collection');
        try {
            await automation.request('collect:garbage', null, null);
        }
        catch (err) {
            debug('error collecting garbage: %o', err);
        }
    }
    else {
        debug('skipping garbage collection');
    }
}, { name: 'checkMemoryPressure', save: true });
/**
 * Adds the memory stats to the cumulative stats.
 * @param stats - memory stats to add to the cumulative stats
 */
const addCumulativeStats = (stats) => {
    debugVerbose('memory stats: %o', stats);
    if (SAVE_MEMORY_STATS) {
        cumulativeStats.push(lodash_1.default.clone(stats));
    }
};
/**
 * Gathers the memory stats and schedules the next check.
 */
const gatherMemoryStats = async () => {
    try {
        await (0, exports.calculateMemoryStats)();
        addCumulativeStats(statsLog);
        statsLog = {};
    }
    catch (err) {
        debug('error gathering memory stats: %o', err);
    }
    scheduleMemoryCheck();
};
/**
 * Schedules the next gathering of memory stats based on the MEMORY_PROFILER_INTERVAL.
 */
const scheduleMemoryCheck = () => {
    if (started) {
        // not setinterval, since gatherMemoryStats is asynchronous
        timer = setTimeout(gatherMemoryStats, MEMORY_PROFILER_INTERVAL);
    }
};
/**
 * Starts the memory profiler.
 * @param automation - the automation client used to interact with the browser
 * @param spec - the current spec file
 */
async function startProfiling(automation, spec) {
    if (started) {
        return;
    }
    debugVerbose('start memory profiler');
    try {
        // ensure we are starting from a clean state
        reset();
        started = true;
        browserInstance = __1.default.getBrowserInstance();
        // stop the profiler when the browser exits
        browserInstance === null || browserInstance === void 0 ? void 0 : browserInstance.once('exit', endProfiling);
        // save the current spec file name to be used later for saving the cumulative stats
        currentSpecFileName = spec === null || spec === void 0 ? void 0 : spec.fileName;
        handler = await (0, exports.getMemoryHandler)();
        // get the js heap size limit and total memory limit once
        // since they don't change during the spec run
        await Promise.all([
            jsHeapSizeLimit = await (0, exports.getJsHeapSizeLimit)(automation),
            totalMemoryLimit = await handler.getTotalMemoryLimit(),
        ]);
        await gatherMemoryStats();
    }
    catch (err) {
        debug('error starting memory profiler: %o', err);
    }
}
/**
 * Saves the cumulative stats to a file.
 */
const saveCumulativeStats = async () => {
    if (SAVE_MEMORY_STATS && currentSpecFileName) {
        try {
            // save the cumulative stats to a file named after the spec file
            await fs_extra_1.default.outputFile(path_1.default.join(MEMORY_FOLDER, `${currentSpecFileName}.json`), JSON.stringify(cumulativeStats));
        }
        catch (err) {
            debugVerbose('error creating memory stats file: %o', err);
        }
    }
};
/**
 * Resets all of the state.
 */
const reset = () => {
    started = false;
    rendererProcess = null;
    cumulativeStats = [];
    collectGarbageOnNextTest = false;
    timer = null;
    currentSpecFileName = null;
    statsLog = {};
    gcLog = {};
    browserInstance === null || browserInstance === void 0 ? void 0 : browserInstance.removeListener('exit', endProfiling);
    browserInstance = null;
};
/**
 * Ends the memory profiler.
 */
const endProfiling = async () => {
    if (!started)
        return;
    // clear the timer
    if (timer)
        clearTimeout(timer);
    // save the cumulative stats to a file
    await saveCumulativeStats();
    reset();
    debugVerbose('end memory profiler');
};
/**
 * Returns all of the memory stats collected thus far.
 * @returns Array of memory stats.
 */
const getMemoryStats = () => {
    return lodash_1.default.clone(cumulativeStats);
};
exports.default = {
    startProfiling,
    endProfiling,
    gatherMemoryStats,
    checkMemoryPressure: checkMemoryPressureAndLog,
    getMemoryStats,
};
