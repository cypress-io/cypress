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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var is_html_1 = __importDefault(require("is-html"));
var http_1 = require("http");
var types_1 = require("../types");
var stream_1 = require("stream");
var net_1 = require("net");
var throttle_1 = __importDefault(require("throttle"));
var mime_types_1 = __importDefault(require("mime-types"));
// TODO: move this into net-stubbing once cy.route is removed
var xhrs_1 = require("@packages/server/lib/controllers/xhrs");
var debug = debug_1.default('cypress:net-stubbing:server:util');
function emit(socket, eventName, data) {
    if (debug.enabled) {
        debug('sending event to driver %o', { eventName: eventName, data: lodash_1.default.chain(data).cloneDeep().omit('res.body').value() });
    }
    socket.toDriver('net:event', eventName, data);
}
exports.emit = emit;
function getAllStringMatcherFields(options) {
    return lodash_1.default.concat(lodash_1.default.filter(types_1.STRING_MATCHER_FIELDS, lodash_1.default.partial(lodash_1.default.has, options)), 
    // add the nested DictStringMatcher values to the list of fields
    lodash_1.default.flatten(lodash_1.default.filter(types_1.DICT_STRING_MATCHER_FIELDS.map(function (field) {
        var value = options[field];
        if (value) {
            return lodash_1.default.keys(value).map(function (key) {
                return field + "." + key;
            });
        }
        return '';
    }))));
}
exports.getAllStringMatcherFields = getAllStringMatcherFields;
/**
 * Generate a "response object" that looks like a real Node HTTP response.
 * Instead of directly manipulating the response by using `res.status`, `res.setHeader`, etc.,
 * generating an IncomingMessage allows us to treat the response the same as any other "real"
 * HTTP response, which means the proxy layer can apply response middleware to it.
 */
function _getFakeClientResponse(opts) {
    var clientResponse = new http_1.IncomingMessage(new net_1.Socket);
    // be nice and infer this content-type for the user
    if (!caseInsensitiveGet(opts.headers || {}, 'content-type') && is_html_1.default(opts.body)) {
        opts.headers['content-type'] = 'text/html';
    }
    lodash_1.default.merge(clientResponse, opts);
    return clientResponse;
}
var caseInsensitiveGet = function (obj, lowercaseProperty) {
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var key = _a[_i];
        if (key.toLowerCase() === lowercaseProperty) {
            return obj[key];
        }
    }
};
function setResponseFromFixture(getFixtureFn, staticResponse) {
    return __awaiter(this, void 0, void 0, function () {
        function getBody() {
            // NOTE: for backwards compatibility with cy.route
            if (data === null) {
                return JSON.stringify('');
            }
            if (!lodash_1.default.isBuffer(data) && !lodash_1.default.isString(data)) {
                // TODO: probably we can use another function in fixtures.js that doesn't require us to remassage the fixture
                return JSON.stringify(data);
            }
            return data;
        }
        var fixture, data, headers, mimeType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fixture = staticResponse.fixture;
                    if (!fixture) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getFixtureFn(fixture.filePath, { encoding: fixture.encoding || null })];
                case 1:
                    data = _a.sent();
                    headers = staticResponse.headers;
                    if (!headers || !caseInsensitiveGet(headers, 'content-type')) {
                        mimeType = mime_types_1.default.lookup(fixture.filePath) || xhrs_1.parseContentType(data);
                        lodash_1.default.set(staticResponse, 'headers.content-type', mimeType);
                    }
                    staticResponse.body = getBody();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setResponseFromFixture = setResponseFromFixture;
/**
 * Using an existing response object, send a response shaped by a StaticResponse object.
 * @param res Response object.
 * @param staticResponse BackendStaticResponse object.
 * @param onResponse Will be called with the response metadata + body stream
 * @param resStream Optionally, provide a Readable stream to be used as the response body (overrides staticResponse.body)
 */
function sendStaticResponse(res, staticResponse, onResponse) {
    if (staticResponse.forceNetworkError) {
        res.connection.destroy();
        res.destroy();
        return;
    }
    var statusCode = staticResponse.statusCode || 200;
    var headers = staticResponse.headers || {};
    var body = staticResponse.body || '';
    var incomingRes = _getFakeClientResponse({
        statusCode: statusCode,
        headers: headers,
        body: body,
    });
    var bodyStream = getBodyStream(body, lodash_1.default.pick(staticResponse, 'throttleKbps', 'continueResponseAt'));
    onResponse(incomingRes, bodyStream);
}
exports.sendStaticResponse = sendStaticResponse;
function getBodyStream(body, options) {
    var continueResponseAt = options.continueResponseAt, throttleKbps = options.throttleKbps;
    var delayMs = continueResponseAt ? lodash_1.default.max([continueResponseAt - Date.now(), 0]) : 0;
    var pt = new stream_1.PassThrough();
    var sendBody = function () {
        var writable = pt;
        if (throttleKbps) {
            // ThrottleStream must be instantiated after any other delays because it uses a `Date.now()`
            // called at construction-time to decide if it's behind on throttling bytes
            writable = new throttle_1.default({ bps: throttleKbps * 1024 });
            writable.pipe(pt);
        }
        if (body) {
            if (body.pipe) {
                return body.pipe(writable);
            }
            writable.write(body);
        }
        return writable.end();
    };
    delayMs ? setTimeout(sendBody, delayMs) : sendBody();
    return pt;
}
exports.getBodyStream = getBodyStream;
