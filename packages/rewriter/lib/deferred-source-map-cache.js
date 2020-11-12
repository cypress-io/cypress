"use strict";
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
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var async_rewriters_1 = require("./async-rewriters");
var sourceMaps = __importStar(require("./util/source-maps"));
var url_1 = __importDefault(require("url"));
var debug = debug_1.default('cypress:rewriter:deferred-source-map-cache');
var caseInsensitiveGet = function (obj, lowercaseProperty) {
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        if (key.toLowerCase() === lowercaseProperty) {
            return obj[key];
        }
    }
};
var getSourceMapHeader = function (headers) {
    // sourcemap has precedence
    // @see https://searchfox.org/mozilla-central/rev/dc4560dcaafd79375b9411fdbbaaebb0a59a93ac/devtools/shared/DevToolsUtils.js#611-619
    return caseInsensitiveGet(headers, 'sourcemap') || caseInsensitiveGet(headers, 'x-sourcemap');
};
/**
 * Holds on to data necessary to rewrite user JS to maybe generate a sourcemap at a later time,
 * potentially composed with the user's own sourcemap if one is present.
 *
 * The purpose of this is to avoid wasting CPU time and network I/O on generating, composing, and
 * sending a sourcemap along with every single rewritten JS snippet, since the source maps are
 * going to be unused and discarded most of the time.
 */
var DeferredSourceMapCache = /** @class */ (function () {
    function DeferredSourceMapCache(requestLib) {
        var _this = this;
        this._idCounter = 0;
        this.requests = [];
        this.defer = function (request) {
            if (_this._getRequestById(request.uniqueId)) {
                // prevent duplicate uniqueIds from ever existing
                throw new Error("Deferred sourcemap key \"" + request.uniqueId + "\" is not unique");
            }
            // remove existing requests for this URL since they will not be loaded again
            _this._removeRequestsByUrl(request.url);
            _this.requests.push(request);
        };
        this.requestLib = requestLib;
    }
    DeferredSourceMapCache.prototype._removeRequestsByUrl = function (url) {
        lodash_1.default.remove(this.requests, { url: url });
    };
    DeferredSourceMapCache.prototype._getRequestById = function (uniqueId) {
        return lodash_1.default.find(this.requests, { uniqueId: uniqueId });
    };
    DeferredSourceMapCache.prototype._getInputSourceMap = function (request, headers) {
        return __awaiter(this, void 0, void 0, function () {
            var sourceMapUrl, inline, req, body, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sourceMapUrl = sourceMaps.getMappingUrl(request.js) || getSourceMapHeader(request.resHeaders);
                        if (!sourceMapUrl) {
                            return [2 /*return*/];
                        }
                        inline = sourceMaps.tryDecodeInlineUrl(sourceMapUrl);
                        if (inline) {
                            return [2 /*return*/, inline];
                        }
                        req = {
                            url: url_1.default.resolve(request.url, sourceMapUrl),
                            // TODO: this assumes that the sourcemap is on the same base domain, so it's safe to send the same headers
                            // the browser sent for this sourcemap request - but if sourcemap is on a different domain, this will not
                            // be true. need to use browser's cookiejar instead.
                            headers: headers,
                            timeout: 5000,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.requestLib(req, true)];
                    case 2:
                        body = (_a.sent()).body;
                        return [2 /*return*/, body];
                    case 3:
                        error_1 = _a.sent();
                        // eslint-disable-next-line no-console
                        debug('got an error loading user-provided sourcemap, serving proxy-generated sourcemap only %o', { url: request.url, headers: headers, error: error_1 });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DeferredSourceMapCache.prototype.resolve = function (uniqueId, headers) {
        return __awaiter(this, void 0, void 0, function () {
            var request, inputSourceMap, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        request = this._getRequestById(uniqueId);
                        if (!request) {
                            throw new Error("Missing request with ID '" + uniqueId + "'");
                        }
                        if (request.sourceMap) {
                            return [2 /*return*/, request.sourceMap];
                        }
                        if (!request.js) {
                            throw new Error('Missing JS for source map rewrite');
                        }
                        return [4 /*yield*/, this._getInputSourceMap(request, headers)
                            // cache the sourceMap so we don't need to regenerate it
                        ];
                    case 1:
                        inputSourceMap = _b.sent();
                        // cache the sourceMap so we don't need to regenerate it
                        _a = request;
                        return [4 /*yield*/, async_rewriters_1.rewriteJsSourceMapAsync(request.url, request.js, inputSourceMap)];
                    case 2:
                        // cache the sourceMap so we don't need to regenerate it
                        _a.sourceMap = _b.sent();
                        delete request.js; // won't need this again
                        delete request.resHeaders;
                        return [2 /*return*/, request.sourceMap];
                }
            });
        });
    };
    return DeferredSourceMapCache;
}());
exports.DeferredSourceMapCache = DeferredSourceMapCache;
