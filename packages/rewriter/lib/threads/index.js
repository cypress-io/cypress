"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var path = __importStar(require("path"));
var os_1 = __importDefault(require("os"));
var worker_threads_1 = require("worker_threads");
var debug = debug_1.default('cypress:rewriter:threads');
var _debugWorker = !debug.enabled ? lodash_1.default.noop : function (worker) {
    return __assign(__assign({}, lodash_1.default.pick(worker, 'isBusy', 'id')), { freeWorkers: lodash_1.default.filter(workers, { isBusy: false }).length });
};
var _debugOpts = !debug.enabled ? lodash_1.default.noop : function (opts) {
    return __assign(__assign({}, lodash_1.default.pick(opts, 'isHtml')), { sourceLength: opts.source.length });
};
// in production, it is preferable to use the transpiled version of `worker.ts`
// because it does not require importing @packages/ts like development does.
// this has a huge performance impact, bringing the `responsiveMs` for threads
// from ~1s to about ~300ms on my system
var WORKER_FILENAME = process.env.CYPRESS_INTERNAL_ENV === 'production' ? 'worker.js' : 'worker-shim.js';
var WORKER_PATH = path.join(__dirname, WORKER_FILENAME);
// spawn up to `os.cpus().length` threads (default to 4 if this call fails)
var MAX_WORKER_THREADS = lodash_1.default.get(os_1.default.cpus(), 'length') || 4;
// spawn up to 4 threads at startup
var INITIAL_WORKER_THREADS = Math.min(MAX_WORKER_THREADS, 4);
var workers = [];
var queued = [];
var originalProcessExit;
// HACK: electron can SIGABRT if exiting while worker_threads are active, so overwrite process.exit
// to ensure that all worker threads are killed *before* exiting.
// @see https://github.com/electron/electron/issues/23366
function wrapProcessExit() {
    var _this = this;
    if (originalProcessExit) {
        return;
    }
    originalProcessExit = process.exit;
    // note - process.exit is normally synchronous, so this could potentially cause strange behavior
    // @ts-ignore
    process.exit = lodash_1.default.once(function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                debug('intercepted process.exit called, closing worker threads');
                terminateAllWorkers()
                    .delay(100)
                    .finally(function () {
                    debug('all workers terminated, exiting for real');
                    originalProcessExit.call.apply(originalProcessExit, __spreadArrays([process], args));
                });
                return [2 /*return*/];
            });
        });
    });
}
function createWorker() {
    var startedAt = Date.now();
    var onlineMs;
    var thread = new worker_threads_1.Worker(WORKER_PATH)
        .on('exit', function (exitCode) {
        debug('worker exited %o', { exitCode: exitCode, worker: _debugWorker(worker) });
        lodash_1.default.remove(workers, worker);
    })
        .on('online', function () {
        onlineMs = Date.now() - startedAt;
    })
        .on('message', function () {
        debug('received initial ready message from worker %o', {
            onlineMs: onlineMs,
            responsiveMs: Date.now() - startedAt,
            worker: _debugWorker(worker),
        });
    });
    var worker = {
        id: thread.threadId,
        isBusy: false,
        thread: thread,
    };
    workers.push(worker);
    wrapProcessExit();
    return worker;
}
function createInitialWorkers() {
    // since workers take a little bit of time to start up (due to loading Node and `require`s),
    // performance can be gained by letting them start before user tests run
    if (workers.length > 0) {
        return;
    }
    lodash_1.default.times(INITIAL_WORKER_THREADS, createWorker);
}
exports.createInitialWorkers = createInitialWorkers;
// try to cleanly shut down worker threads to avoid SIGABRT in Electron
// @see https://github.com/electron/electron/issues/23366
function shutdownWorker(workerInfo) {
    var thread = workerInfo.thread;
    return new bluebird_1.default(function (resolve) {
        thread.once('exit', resolve);
        thread.once('error', resolve);
        thread.postMessage({ shutdown: true });
    })
        .timeout(100)
        .catch(function (err) {
        debug('error cleanly shutting down worker, terminating from parent %o', { err: err, workerInfo: _debugWorker(workerInfo) });
        return thread.terminate();
    });
}
exports.shutdownWorker = shutdownWorker;
function terminateAllWorkers() {
    return bluebird_1.default.map(workers, shutdownWorker);
}
exports.terminateAllWorkers = terminateAllWorkers;
function sendRewrite(worker, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var startedAt, _a, port1, port2, req, code;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    startedAt = Date.now();
                    debug('sending rewrite to worker %o', { worker: _debugWorker(worker), opts: _debugOpts(opts) });
                    if (worker.isBusy) {
                        throw new Error('worker is already busy');
                    }
                    worker.isBusy = true;
                    if (!getFreeWorker() && workers.length < MAX_WORKER_THREADS) {
                        // create a worker in anticipation of another rewrite coming in
                        createWorker();
                    }
                    _a = new worker_threads_1.MessageChannel(), port1 = _a.port1, port2 = _a.port2;
                    req = __assign({ port: port1 }, lodash_1.default.omit(opts, 'deferSourceMapRewrite'));
                    worker.thread.postMessage(req, [req.port]);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var onExit = function (exitCode) {
                                reject(new Error("worker exited with exit code " + exitCode));
                            };
                            worker.thread.once('exit', onExit);
                            worker.thread.once('error', reject);
                            port2.on('message', function (res) {
                                if (res.deferredSourceMap) {
                                    return opts.deferSourceMapRewrite(res.deferredSourceMap);
                                }
                                var totalMs = Date.now() - startedAt;
                                debug('received response from worker %o', {
                                    error: res.error,
                                    totalMs: Date.now() - startedAt,
                                    threadMs: res.threadMs,
                                    overheadMs: totalMs - res.threadMs,
                                    worker: _debugWorker(worker),
                                    opts: _debugOpts(opts),
                                });
                                worker.thread.removeListener('exit', onExit);
                                worker.thread.removeListener('error', reject);
                                if (res.error) {
                                    return reject(res.error);
                                }
                                return resolve(res.output);
                            });
                        })
                            .finally(function () {
                            port2.close();
                            worker.isBusy = false;
                            maybeRunNextInQueue();
                        })];
                case 1:
                    code = _b.sent();
                    return [2 /*return*/, code];
            }
        });
    });
}
function maybeRunNextInQueue() {
    var next = queued.shift();
    if (!next) {
        return;
    }
    debug('running next rewrite in queue', { opts: _debugOpts() });
    queueRewriting(next.opts)
        .then(next.deferred.resolve)
        .catch(next.deferred.reject);
}
function getFreeWorker() {
    return lodash_1.default.find(workers, { isBusy: false });
}
function queueRewriting(opts) {
    // if a worker is free now, use it
    var freeWorker = getFreeWorker();
    if (freeWorker) {
        debug('sending source to free worker');
        return sendRewrite(freeWorker, opts);
    }
    // if there's room, create a new thread
    if (workers.length < MAX_WORKER_THREADS) {
        debug('creating new worker');
        var newWorker = createWorker();
        return sendRewrite(newWorker, opts);
    }
    // otherwise enqueue
    debug('enqueuing source for rewriting %o', { opts: _debugOpts(opts), prevQueueLength: queued.length });
    var deferred = getDeferredPromise();
    queued.push({ opts: opts, deferred: deferred });
    return deferred.p;
}
exports.queueRewriting = queueRewriting;
function getDeferredPromise() {
    var resolve;
    var reject;
    var p = new Promise(function (_resolve, _reject) {
        resolve = _resolve;
        reject = _reject;
    });
    return { p: p, resolve: resolve, reject: reject };
}
