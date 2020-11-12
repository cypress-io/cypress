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
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var lodash_1 = __importDefault(require("lodash"));
var marionette_client_1 = __importDefault(require("marionette-client"));
var message_js_1 = require("marionette-client/lib/marionette/message.js");
var util_1 = __importDefault(require("util"));
var foxdriver_1 = __importDefault(require("@benmalka/foxdriver"));
var protocol = __importStar(require("./protocol"));
var errors = require('../errors');
var debug = debug_1.default('cypress:server:browsers:firefox-util');
var forceGcCc;
var timings = {
    gc: [],
    cc: [],
    collections: [],
};
var getTabId = function (tab) {
    return lodash_1.default.get(tab, 'browsingContextID');
};
var getDelayMsForRetry = function (i) {
    if (i < 10) {
        return 100;
    }
    if (i < 18) {
        return 500;
    }
    if (i < 63) {
        return 1000;
    }
    return;
};
var getPrimaryTab = bluebird_1.default.method(function (browser) {
    var setPrimaryTab = function () {
        return browser.listTabs()
            .then(function (tabs) {
            browser.tabs = tabs;
            return browser.primaryTab = lodash_1.default.first(tabs);
        });
    };
    // on first connection
    if (!browser.primaryTab) {
        return setPrimaryTab();
    }
    // `listTabs` will set some internal state, including marking attached tabs
    // as detached. so use the raw `request` here:
    return browser.request('listTabs')
        .then(function (_a) {
        var tabs = _a.tabs;
        var firstTab = lodash_1.default.first(tabs);
        // primaryTab has changed, get all tabs and rediscover first tab
        if (getTabId(browser.primaryTab.data) !== getTabId(firstTab)) {
            return setPrimaryTab();
        }
        return browser.primaryTab;
    });
});
var attachToTabMemory = bluebird_1.default.method(function (tab) {
    // TODO: figure out why tab.memory is sometimes undefined
    if (!tab.memory)
        return;
    if (tab.memory.isAttached) {
        return;
    }
    return tab.memory.getState()
        .then(function (state) {
        if (state === 'attached') {
            return;
        }
        tab.memory.on('garbage-collection', function (_a) {
            var data = _a.data;
            data.num = timings.collections.length + 1;
            timings.collections.push(data);
            debug('received garbage-collection event %o', data);
        });
        return tab.memory.attach();
    });
});
var logGcDetails = function () {
    var reducedTimings = __assign(__assign({}, timings), { collections: lodash_1.default.map(timings.collections, function (event) {
            return lodash_1.default
                .chain(event)
                .extend({
                duration: lodash_1.default.sumBy(event.collections, function (collection) {
                    return collection.endTimestamp - collection.startTimestamp;
                }),
                spread: lodash_1.default.chain(event.collections).thru(function (collection) {
                    var first = lodash_1.default.first(collection);
                    var last = lodash_1.default.last(collection);
                    return last.endTimestamp - first.startTimestamp;
                }).value(),
            })
                .pick('num', 'nonincrementalReason', 'reason', 'gcCycleNumber', 'duration', 'spread')
                .value();
        }) });
    debug('forced GC timings %o', util_1.default.inspect(reducedTimings, {
        breakLength: Infinity,
        maxArrayLength: Infinity,
    }));
    debug('forced GC times %o', {
        gc: reducedTimings.gc.length,
        cc: reducedTimings.cc.length,
        collections: reducedTimings.collections.length,
    });
    debug('forced GC averages %o', {
        gc: lodash_1.default.chain(reducedTimings.gc).sum().divide(reducedTimings.gc.length).value(),
        cc: lodash_1.default.chain(reducedTimings.cc).sum().divide(reducedTimings.cc.length).value(),
        collections: lodash_1.default.chain(reducedTimings.collections).sumBy('duration').divide(reducedTimings.collections.length).value(),
        spread: lodash_1.default.chain(reducedTimings.collections).sumBy('spread').divide(reducedTimings.collections.length).value(),
    });
    debug('forced GC totals %o', {
        gc: lodash_1.default.sum(reducedTimings.gc),
        cc: lodash_1.default.sum(reducedTimings.cc),
        collections: lodash_1.default.sumBy(reducedTimings.collections, 'duration'),
        spread: lodash_1.default.sumBy(reducedTimings.collections, 'spread'),
    });
    // reset all the timings
    timings = {
        gc: [],
        cc: [],
        collections: [],
    };
};
exports.default = {
    log: function () {
        logGcDetails();
    },
    collectGarbage: function () {
        return forceGcCc();
    },
    setup: function (_a) {
        var extensions = _a.extensions, url = _a.url, marionettePort = _a.marionettePort, foxdriverPort = _a.foxdriverPort;
        return bluebird_1.default.all([
            this.setupFoxdriver(foxdriverPort),
            this.setupMarionette(extensions, url, marionettePort),
        ]);
    },
    setupFoxdriver: function (port) {
        return __awaiter(this, void 0, void 0, function () {
            var foxdriver, browser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, protocol._connectAsync({
                            host: '127.0.0.1',
                            port: port,
                            getDelayMsForRetry: getDelayMsForRetry,
                        })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, foxdriver_1.default.attach('127.0.0.1', port)];
                    case 2:
                        foxdriver = _a.sent();
                        browser = foxdriver.browser;
                        browser.on('error', function (err) {
                            debug('received error from foxdriver connection, ignoring %o', err);
                        });
                        forceGcCc = function () {
                            var gcDuration;
                            var ccDuration;
                            var gc = function (tab) {
                                return function () {
                                    // TODO: figure out why tab.memory is sometimes undefined
                                    if (!tab.memory)
                                        return;
                                    var start = Date.now();
                                    return tab.memory.forceGarbageCollection()
                                        .then(function () {
                                        gcDuration = Date.now() - start;
                                        timings.gc.push(gcDuration);
                                    });
                                };
                            };
                            var cc = function (tab) {
                                return function () {
                                    // TODO: figure out why tab.memory is sometimes undefined
                                    if (!tab.memory)
                                        return;
                                    var start = Date.now();
                                    return tab.memory.forceCycleCollection()
                                        .then(function () {
                                        ccDuration = Date.now() - start;
                                        timings.cc.push(ccDuration);
                                    });
                                };
                            };
                            debug('forcing GC and CC...');
                            return getPrimaryTab(browser)
                                .then(function (tab) {
                                return attachToTabMemory(tab)
                                    .then(gc(tab))
                                    .then(cc(tab));
                            })
                                .then(function () {
                                debug('forced GC and CC completed %o', { ccDuration: ccDuration, gcDuration: gcDuration });
                            })
                                .tapCatch(function (err) {
                                debug('firefox RDP error while forcing GC and CC %o', err);
                            });
                        };
                        return [2 /*return*/];
                }
            });
        });
    },
    setupMarionette: function (extensions, url, port) {
        return __awaiter(this, void 0, void 0, function () {
            var driver, sendMarionette, onError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, protocol._connectAsync({
                            host: '127.0.0.1',
                            port: port,
                            getDelayMsForRetry: getDelayMsForRetry,
                        })];
                    case 1:
                        _a.sent();
                        driver = new marionette_client_1.default.Drivers.Promises({
                            port: port,
                            tries: 1,
                        });
                        sendMarionette = function (data) {
                            return driver.send(new message_js_1.Command(data));
                        };
                        debug('firefox: navigating page with webdriver');
                        onError = function (from, reject) {
                            if (!reject) {
                                reject = function (err) {
                                    throw err;
                                };
                            }
                            return function (err) {
                                debug('error in marionette %o', { from: from, err: err });
                                reject(errors.get('FIREFOX_MARIONETTE_FAILURE', from, err));
                            };
                        };
                        return [4 /*yield*/, driver.connect()
                                .catch(onError('connection'))];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, new bluebird_1.default(function (resolve, reject) {
                                var _onError = function (from) {
                                    return onError(from, reject);
                                };
                                var tcp = driver.tcp;
                                tcp.socket.on('error', _onError('Socket'));
                                tcp.client.on('error', _onError('CommandStream'));
                                sendMarionette({
                                    name: 'WebDriver:NewSession',
                                    parameters: { acceptInsecureCerts: true },
                                }).then(function () {
                                    return bluebird_1.default.all(lodash_1.default.map(extensions, function (path) {
                                        return sendMarionette({
                                            name: 'Addon:Install',
                                            parameters: { path: path, temporary: true },
                                        });
                                    }));
                                })
                                    .then(function () {
                                    return sendMarionette({
                                        name: 'WebDriver:Navigate',
                                        parameters: { url: url },
                                    });
                                })
                                    .then(resolve)
                                    .catch(_onError('commands'));
                            })
                            // even though Marionette is not used past this point, we have to keep the session open
                            // or else `acceptInsecureCerts` will cease to apply and SSL validation prompts will appear.
                        ];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
};
