"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = exports._printGroupedProcesses = exports._aggregateGroups = exports._renameBrowserGroup = exports.groupCyProcesses = exports._reset = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lazy_ass_1 = tslib_1.__importDefault(require("lazy-ass"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const systeminformation_1 = tslib_1.__importDefault(require("systeminformation"));
const network_1 = require("@packages/network");
const browsers = require('../browsers');
const plugins = require('../plugins');
const debug = (0, debug_1.default)('cypress:server:util:process_profiler');
const debugVerbose = (0, debug_1.default)('cypress-verbose:server:util:process_profiler');
const interval = Number(process.env.CYPRESS_PROCESS_PROFILER_INTERVAL) || 10000;
let started = false;
let groupsOverTime = {};
const _reset = () => {
    groupsOverTime = {};
};
exports._reset = _reset;
const formatPidDisplay = (groupedProcesses) => {
    const pids = lodash_1.default.map(groupedProcesses, 'pid');
    const maxArrayLength = 6;
    let display = pids.slice(0, maxArrayLength).join(', ');
    if (pids.length > maxArrayLength) {
        display += ` ... ${pids.length - maxArrayLength} more items`;
    }
    return display;
};
const groupCyProcesses = ({ list }) => {
    const cyProcesses = [];
    const thisProcess = lodash_1.default.find(list, { pid: process.pid });
    (0, lazy_ass_1.default)(thisProcess, 'expected to find current pid in process list', process.pid);
    const isParentProcessInGroup = (proc, group) => {
        return lodash_1.default.chain(cyProcesses).filter({ group }).map('pid').includes(proc.parentPid).value();
    };
    // is this a browser process launched to run Cypress tests?
    const isBrowserProcess = (proc) => {
        const instance = browsers.getBrowserInstance();
        // electron will return a list of pids, since it's not a hierarchy
        const pids = (instance === null || instance === void 0 ? void 0 : instance.allPids) ? instance.allPids : [instance === null || instance === void 0 ? void 0 : instance.pid];
        return (pids.includes(proc.pid))
            || isParentProcessInGroup(proc, 'browser');
    };
    const isPluginProcess = (proc) => {
        return proc.pid === plugins.getPluginPid()
            || isParentProcessInGroup(proc, 'plugin');
    };
    // is this the renderer for the launchpad?
    const isDesktopGuiProcess = (proc) => {
        var _a;
        return ((_a = proc.params) === null || _a === void 0 ? void 0 : _a.includes('--type=renderer'))
            && !isBrowserProcess(proc);
    };
    // these processes may be shared between the AUT and launchpad.
    // rather than treat them as part of the `browser` in `run` mode and have
    // their usage in `open` mode be ambiguous, just put them in their own group
    const isElectronSharedProcess = (proc) => {
        const isType = (type) => {
            var _a;
            return (_a = proc.params) === null || _a === void 0 ? void 0 : _a.includes(`--type=${type}`);
        };
        return isType('broker')
            || isType('gpu-process')
            || isType('utility')
            || isType('zygote');
    };
    const isFfmpegProcess = (proc) => {
        return proc.parentPid === thisProcess.pid
            && /ffmpeg/i.test(proc.name);
    };
    const getProcessGroup = (proc) => {
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
            return 'launchpad';
        }
        if (isFfmpegProcess(proc)) {
            return 'ffmpeg';
        }
        if (isElectronSharedProcess(proc)) {
            return 'electron-shared';
        }
        return 'other';
    };
    const classifyProcess = (proc) => {
        const classify = (group) => {
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
exports.groupCyProcesses = groupCyProcesses;
const _renameBrowserGroup = (processes) => {
    const instance = browsers.getBrowserInstance();
    const displayName = lodash_1.default.get(instance, 'browser.displayName');
    processes.forEach((proc) => {
        if (!displayName) {
            return;
        }
        if (proc.group === 'browser') {
            proc.group = displayName;
        }
    });
    return processes;
};
exports._renameBrowserGroup = _renameBrowserGroup;
const _aggregateGroups = (processes) => {
    debugVerbose('all Cypress-launched processes: %s', require('util').inspect(processes));
    const groupTotals = lodash_1.default.chain(processes)
        .groupBy('group')
        .mapValues((groupedProcesses, group) => {
        return {
            group,
            processCount: groupedProcesses.length,
            pids: formatPidDisplay(groupedProcesses),
            cpuPercent: lodash_1.default.sumBy(groupedProcesses, 'cpu'),
            memRssMb: lodash_1.default.sumBy(groupedProcesses, 'memRss') / 1024,
        };
    })
        .values()
        .sortBy('memRssMb')
        .reverse()
        .value();
    groupTotals.push(lodash_1.default.reduce(groupTotals, (acc, val) => {
        acc.processCount += val.processCount;
        acc.cpuPercent += val.cpuPercent;
        acc.memRssMb += val.memRssMb;
        return acc;
    }, { group: 'TOTAL', processCount: 0, pids: '-', cpuPercent: 0, memRssMb: 0 }));
    groupTotals.forEach((total) => {
        if (!groupsOverTime[total.group]) {
            groupsOverTime[total.group] = [];
        }
        const measurements = groupsOverTime[total.group];
        measurements.push(total);
        lodash_1.default.merge(total, {
            meanCpuPercent: lodash_1.default.meanBy(measurements, 'cpuPercent'),
            meanMemRssMb: lodash_1.default.meanBy(measurements, 'memRssMb'),
            maxMemRssMb: lodash_1.default.max(lodash_1.default.map(measurements, lodash_1.default.property('memRssMb'))),
        });
        lodash_1.default.forEach(total, (v, k) => {
            // round all numbers to 100ths precision
            if (lodash_1.default.isNumber(v)) {
                total[k] = lodash_1.default.round(v, 2);
            }
        });
    });
    return groupTotals;
};
exports._aggregateGroups = _aggregateGroups;
const _printGroupedProcesses = (groupTotals) => {
    const consoleBuffer = (0, network_1.concatStream)((buf) => {
        // get rid of trailing newline
        debug(String(buf).trim());
    });
    // eslint-disable-next-line no-console
    const buffedConsole = new console.Console(consoleBuffer);
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
exports._printGroupedProcesses = _printGroupedProcesses;
function _checkProcesses() {
    return systeminformation_1.default.processes()
        .then(exports.groupCyProcesses)
        .then(exports._renameBrowserGroup)
        .then(exports._aggregateGroups)
        .then(exports._printGroupedProcesses)
        .then(_scheduleProcessCheck)
        .catch((err) => {
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
    _checkProcesses().catch(() => { });
    started = true;
}
exports.start = start;
