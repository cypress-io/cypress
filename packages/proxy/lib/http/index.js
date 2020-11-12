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
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var error_middleware_1 = __importDefault(require("./error-middleware"));
var buffers_1 = require("./util/buffers");
var bluebird_1 = __importDefault(require("bluebird"));
var request_middleware_1 = __importDefault(require("./request-middleware"));
var response_middleware_1 = __importDefault(require("./response-middleware"));
var rewriter_1 = require("@packages/rewriter");
var debug = debug_1.default('cypress:proxy:http');
var HttpStages;
(function (HttpStages) {
    HttpStages[HttpStages["IncomingRequest"] = 0] = "IncomingRequest";
    HttpStages[HttpStages["IncomingResponse"] = 1] = "IncomingResponse";
    HttpStages[HttpStages["Error"] = 2] = "Error";
})(HttpStages = exports.HttpStages || (exports.HttpStages = {}));
var READONLY_MIDDLEWARE_KEYS = [
    'buffers',
    'config',
    'getFileServerToken',
    'getRemoteState',
    'netStubbingState',
    'next',
    'end',
    'onResponse',
    'onError',
    'skipMiddleware',
];
function _runStage(type, ctx) {
    var stage = HttpStages[type];
    debug('Entering stage %o', { stage: stage });
    var runMiddlewareStack = function () {
        var middlewares = ctx.middleware[type];
        // pop the first pair off the middleware
        var middlewareName = lodash_1.default.keys(middlewares)[0];
        if (!middlewareName) {
            return bluebird_1.default.resolve();
        }
        var middleware = middlewares[middlewareName];
        ctx.middleware[type] = lodash_1.default.omit(middlewares, middlewareName);
        return new bluebird_1.default(function (resolve) {
            var ended = false;
            function copyChangedCtx() {
                lodash_1.default.chain(fullCtx)
                    .omit(READONLY_MIDDLEWARE_KEYS)
                    .forEach(function (value, key) {
                    if (ctx[key] !== value) {
                        ctx[key] = value;
                    }
                })
                    .value();
            }
            function _end(retval) {
                if (ended) {
                    return;
                }
                ended = true;
                copyChangedCtx();
                resolve(retval);
            }
            if (!middleware) {
                return resolve();
            }
            debug('Running middleware %o', { stage: stage, middlewareName: middlewareName });
            var fullCtx = __assign({ next: function () {
                    copyChangedCtx();
                    _end(runMiddlewareStack());
                }, end: function () { return _end(); }, onResponse: function (incomingRes, resStream) {
                    ctx.incomingRes = incomingRes;
                    ctx.incomingResStream = resStream;
                    _end();
                }, onError: function (error) {
                    debug('Error in middleware %o', { stage: stage, middlewareName: middlewareName, error: error });
                    if (type === HttpStages.Error) {
                        return;
                    }
                    ctx.error = error;
                    _end(_runStage(HttpStages.Error, ctx));
                }, skipMiddleware: function (name) {
                    ctx.middleware[type] = lodash_1.default.omit(ctx.middleware[type], name);
                } }, ctx);
            try {
                middleware.call(fullCtx);
            }
            catch (err) {
                fullCtx.onError(err);
            }
        });
    };
    return runMiddlewareStack()
        .then(function () {
        debug('Leaving stage %o', { stage: stage });
    });
}
exports._runStage = _runStage;
var Http = /** @class */ (function () {
    function Http(opts) {
        var _a;
        this.buffers = new buffers_1.HttpBuffers();
        this.deferredSourceMapCache = new rewriter_1.DeferredSourceMapCache(opts.request);
        this.config = opts.config;
        this.getFileServerToken = opts.getFileServerToken;
        this.getRemoteState = opts.getRemoteState;
        this.middleware = opts.middleware;
        this.netStubbingState = opts.netStubbingState;
        this.socket = opts.socket;
        this.request = opts.request;
        if (typeof opts.middleware === 'undefined') {
            this.middleware = (_a = {},
                _a[HttpStages.IncomingRequest] = request_middleware_1.default,
                _a[HttpStages.IncomingResponse] = response_middleware_1.default,
                _a[HttpStages.Error] = error_middleware_1.default,
                _a);
        }
    }
    Http.prototype.handle = function (req, res) {
        var _this = this;
        var ctx = {
            req: req,
            res: res,
            buffers: this.buffers,
            config: this.config,
            getFileServerToken: this.getFileServerToken,
            getRemoteState: this.getRemoteState,
            request: this.request,
            middleware: lodash_1.default.cloneDeep(this.middleware),
            netStubbingState: this.netStubbingState,
            socket: this.socket,
            deferSourceMapRewrite: function (opts) {
                _this.deferredSourceMapCache.defer(__assign({ resHeaders: ctx.incomingRes.headers }, opts));
            },
        };
        return _runStage(HttpStages.IncomingRequest, ctx)
            .then(function () {
            if (ctx.incomingRes) {
                return _runStage(HttpStages.IncomingResponse, ctx);
            }
            return debug('warning: Request was not fulfilled with a response.');
        });
    };
    Http.prototype.handleSourceMapRequest = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var sm, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.deferredSourceMapCache.resolve(req.params.id, req.headers)];
                    case 1:
                        sm = _a.sent();
                        if (!sm) {
                            throw new Error('no sourcemap found');
                        }
                        res.json(sm);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        res.status(500).json({ err: err_1 });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Http.prototype.reset = function () {
        this.buffers.reset();
    };
    Http.prototype.setBuffer = function (buffer) {
        return this.buffers.set(buffer);
    };
    return Http;
}());
exports.Http = Http;
