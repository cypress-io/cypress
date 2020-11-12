"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var lazy_ass_1 = __importDefault(require("lazy-ass"));
var lodash_1 = __importDefault(require("lodash"));
var systeminformation_1 = __importDefault(require("systeminformation"));
var network_1 = require("@packages/network");
var browsers = require('../browsers');
var plugins = require('../plugins');
var debug = debug_1.default('cypress:server:util:process_profiler');
var debugVerbose = debug_1.default('cypress-verbose:server:util:process_profiler');
var interval = Number(process.env.CYPRESS_PROCESS_PROFILER_INTERVAL) || 10000;
var started = false;
var groupsOverTime = {};
exports._reset = function () {
    groupsOverTime = {};
};
var formatPidDisplay = function (groupedProcesses) {
    var pids = lodash_1.default.map(groupedProcesses, 'pid');
    var maxArrayLength = 6;
    var display = pids.slice(0, maxArrayLength).join(', ');
    if (pids.length > maxArrayLength) {
        display += " ... " + (pids.length - maxArrayLength) + " more items";
    }
    return display;
};
exports._groupCyProcesses = function (_a) {
    var list = _a.list;
    var cyProcesses = [];
    var thisProcess = lodash_1.default.find(list, { pid: process.pid });
    lazy_ass_1.default(thisProcess, 'expected to find current pid in process list', process.pid);
    var isParentProcessInGroup = function (proc, group) {
        return lodash_1.default.chain(cyProcesses).filter({ group: group }).map('pid').includes(proc.parentPid).value();
    };
    // is this a browser process launched to run Cypress tests?
    var isBrowserProcess = function (proc) {
        var instance = browsers.getBrowserInstance();
        // electron will return a list of pids, since it's not a hierarchy
        var pid = instance && instance.pid;
        return (Array.isArray(pid) ? pid.includes(proc.pid) : proc.pid === pid)
            || isParentProcessInGroup(proc, 'browser');
    };
    var isPluginProcess = function (proc) {
        return proc.pid === plugins.getPluginPid()
            || isParentProcessInGroup(proc, 'plugin');
    };
    // is this the renderer for the desktop-gui?
    var isDesktopGuiProcess = function (proc) {
        return proc.params.includes('--type=renderer')
            && !isBrowserProcess(proc);
    };
    // these processes may be shared between the AUT and desktop-gui
    // rather than treat them as part of the `browser` in `run` mode and have
    // their usage in `open` mode be ambiguous, just put them in their own group
    var isElectronSharedProcess = function (proc) {
        var isType = function (type) {
            return proc.params.includes("--type=" + type);
        };
        return isType('broker')
            || isType('gpu-process')
            || isType('utility')
            || isType('zygote');
    };
    var isFfmpegProcess = function (proc) {
        return proc.parentPid === thisProcess.pid
            && /ffmpeg/i.test(proc.name);
    };
    var getProcessGroup = function (proc) {
        if (proc === thisProcess) {
            return 'cypress';
        }
        if (isBrowserProcess(proc)) {
            return 'browser';
        }
        if (isPluginProcess(proc)) {
            return 'plugin';
        }
        if (isDesktopGuiProcess(proc)) {
            return 'desktop-gui';
        }
        if (isFfmpegProcess(proc)) {
            return 'ffmpeg';
        }
        if (isElectronSharedProcess(proc)) {
            return 'electron-shared';
        }
        return 'other';
    };
    var classifyProcess = function (proc) {
        var classify = function (group) {
            proc.group = group;
            cyProcesses.push(proc);
            // queue all children
            lodash_1.default.chain(list)
                .filter({ parentPid: proc.pid })
                .map(classifyProcess)
                .value();
        };
        classify(getProcessGroup(proc));
    };
    classifyProcess(thisProcess);
    return cyProcesses;
};
exports._renameBrowserGroup = function (processes) {
    var instance = browsers.getBrowserInstance();
    var displayName = lodash_1.default.get(instance, 'browser.displayName');
    processes.forEach(function (proc) {
        if (!displayName) {
            return;
        }
        if (proc.group === 'browser') {
            proc.group = displayName;
        }
    });
    return processes;
};
exports._aggregateGroups = function (processes) {
    debugVerbose('all Cypress-launched processes: %s', require('util').inspect(processes));
    var groupTotals = lodash_1.default.chain(processes)
        .groupBy('group')
        .mapValues(function (groupedProcesses, group) {
        return {
            group: group,
            processCount: groupedProcesses.length,
            pids: formatPidDisplay(groupedProcesses),
            cpuPercent: lodash_1.default.sumBy(groupedProcesses, 'pcpu'),
            memRssMb: lodash_1.default.sumBy(groupedProcesses, 'mem_rss') / 1024,
        };
    })
        .values()
        .sortBy('memRssMb')
        .reverse()
        .value();
    groupTotals.push(lodash_1.default.reduce(groupTotals, function (acc, val) {
        acc.processCount += val.processCount;
        acc.cpuPercent += val.cpuPercent;
        acc.memRssMb += val.memRssMb;
        return acc;
    }, { group: 'TOTAL', processCount: 0, pids: '-', cpuPercent: 0, memRssMb: 0 }));
    groupTotals.forEach(function (total) {
        if (!groupsOverTime[total.group]) {
            groupsOverTime[total.group] = [];
        }
        var measurements = groupsOverTime[total.group];
        measurements.push(total);
        lodash_1.default.merge(total, {
            meanCpuPercent: lodash_1.default.meanBy(measurements, 'cpuPercent'),
            meanMemRssMb: lodash_1.default.meanBy(measurements, 'memRssMb'),
            maxMemRssMb: lodash_1.default.max(lodash_1.default.map(measurements, lodash_1.default.property('memRssMb'))),
        });
        lodash_1.default.forEach(total, function (v, k) {
            // round all numbers to 100ths precision
            if (lodash_1.default.isNumber(v)) {
                total[k] = lodash_1.default.round(v, 2);
            }
        });
    });
    return groupTotals;
};
exports._printGroupedProcesses = function (groupTotals) {
    var consoleBuffer = network_1.concatStream(function (buf) {
        // get rid of trailing newline
        debug(String(buf).trim());
    });
    // eslint-disable-next-line no-console
    var buffedConsole = new console.Console(consoleBuffer);
    buffedConsole.log('current & mean memory and CPU usage by process group:');
    buffedConsole.table(groupTotals, [
        'group',
        'processCount',
        'pids',
        'cpuPercent',
        'meanCpuPercent',
        'memRssMb',
        'meanMemRssMb',
        'maxMemRssMb',
    ]);
    consoleBuffer.end();
};
function _checkProcesses() {
    return systeminformation_1.default.processes()
        .then(exports._groupCyProcesses)
        .then(exports._renameBrowserGroup)
        .then(exports._aggregateGroups)
        .then(exports._printGroupedProcesses)
        .then(_scheduleProcessCheck)
        .catch(function (err) {
        debug('error running process profiler: %o', err);
    });
}
function _scheduleProcessCheck() {
    // not setinterval, since checkProcesses is asynchronous
    setTimeout(_checkProcesses, interval);
}
function start() {
    if (!debug.enabled && !debugVerbose.enabled) {
        debug('process profiler not enabled');
        return;
    }
    if (started) {
        return;
    }
    _checkProcesses();
    started = true;
}
exports.start = start;
