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
var concat_stream_1 = __importDefault(require("concat-stream"));
var debug_1 = __importDefault(require("debug"));
var types_1 = require("../types");
var util_1 = require("./util");
var debug = debug_1.default('cypress:net-stubbing:server:intercept-response');
exports.InterceptResponse = function () {
    var _this = this;
    var backendRequest = this.netStubbingState.requests[this.req.requestId];
    debug('InterceptResponse %o', { req: lodash_1.default.pick(this.req, 'url'), backendRequest: backendRequest });
    if (!backendRequest) {
        // original request was not intercepted, nothing to do
        return this.next();
    }
    backendRequest.incomingRes = this.incomingRes;
    backendRequest.onResponse = function (incomingRes, resStream) {
        _this.incomingRes = incomingRes;
        backendRequest.continueResponse(resStream);
    };
    backendRequest.continueResponse = function (newResStream) {
        if (newResStream) {
            _this.incomingResStream = newResStream.on('error', _this.onError);
        }
        _this.next();
    };
    var frame = {
        routeHandlerId: backendRequest.route.handlerId,
        requestId: backendRequest.requestId,
        res: lodash_1.default.extend(lodash_1.default.pick(this.incomingRes, types_1.SERIALIZABLE_RES_PROPS), {
            url: this.req.proxiedUrl,
        }),
    };
    var res = frame.res;
    var emitReceived = function () {
        util_1.emit(_this.socket, 'http:response:received', frame);
    };
    this.makeResStreamPlainText();
    this.incomingResStream.pipe(concat_stream_1.default(function (resBody) {
        res.body = resBody.toString();
        emitReceived();
    }));
    if (!backendRequest.waitForResponseContinue) {
        this.next();
    }
    // this may get set back to `true` by another route
    backendRequest.waitForResponseContinue = false;
};
function onResponseContinue(state, frame) {
    return __awaiter(this, void 0, void 0, function () {
        var backendRequest, res, throttleKbps, continueResponseAt, staticResponse, bodyStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    backendRequest = state.requests[frame.requestId];
                    if (typeof backendRequest === 'undefined') {
                        return [2 /*return*/];
                    }
                    res = backendRequest.res;
                    debug('_onResponseContinue %o', { backendRequest: lodash_1.default.omit(backendRequest, 'res.body'), frame: lodash_1.default.omit(frame, 'res.body') });
                    throttleKbps = lodash_1.default.get(frame, 'staticResponse.throttleKbps') || frame.throttleKbps;
                    continueResponseAt = lodash_1.default.get(frame, 'staticResponse.continueResponseAt') || frame.continueResponseAt;
                    if (!frame.staticResponse) return [3 /*break*/, 2];
                    // replacing response with a staticResponse
                    return [4 /*yield*/, util_1.setResponseFromFixture(backendRequest.route.getFixture, frame.staticResponse)];
                case 1:
                    // replacing response with a staticResponse
                    _a.sent();
                    staticResponse = lodash_1.default.chain(frame.staticResponse).clone().assign({ continueResponseAt: continueResponseAt, throttleKbps: throttleKbps }).value();
                    return [2 /*return*/, util_1.sendStaticResponse(res, staticResponse, backendRequest.onResponse)];
                case 2:
                    // merge the changed response attributes with our response and continue
                    lodash_1.default.assign(res, lodash_1.default.pick(frame.res, types_1.SERIALIZABLE_RES_PROPS));
                    bodyStream = util_1.getBodyStream(res.body, { throttleKbps: throttleKbps, continueResponseAt: continueResponseAt });
                    return [2 /*return*/, backendRequest.continueResponse(bodyStream)];
            }
        });
    });
}
exports.onResponseContinue = onResponseContinue;
