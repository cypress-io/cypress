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
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var debug_1 = __importDefault(require("debug"));
var util_1 = require("./util");
var intercept_request_1 = require("./intercept-request");
var intercept_response_1 = require("./intercept-response");
var debug = debug_1.default('cypress:net-stubbing:server:driver-events');
function _onRouteAdded(state, getFixture, options) {
    return __awaiter(this, void 0, void 0, function () {
        var routeMatcher, staticResponse, route;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    routeMatcher = _restoreMatcherOptionsTypes(options.routeMatcher);
                    staticResponse = options.staticResponse;
                    if (!staticResponse) return [3 /*break*/, 2];
                    return [4 /*yield*/, util_1.setResponseFromFixture(getFixture, staticResponse)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    route = __assign({ routeMatcher: routeMatcher,
                        getFixture: getFixture }, lodash_1.default.omit(options, 'routeMatcher'));
                    state.routes.push(route);
                    return [2 /*return*/];
            }
        });
    });
}
function _restoreMatcherOptionsTypes(options) {
    var stringMatcherFields = util_1.getAllStringMatcherFields(options);
    var ret = {};
    stringMatcherFields.forEach(function (field) {
        var obj = lodash_1.default.get(options, field);
        if (!obj) {
            return;
        }
        var value = obj.value, type = obj.type;
        if (type === 'regex') {
            var lastSlashI = value.lastIndexOf('/');
            var flags = value.slice(lastSlashI + 1);
            var pattern = value.slice(1, lastSlashI);
            value = new RegExp(pattern, flags);
        }
        lodash_1.default.set(ret, field, value);
    });
    var noAnnotationRequiredFields = ['https', 'port', 'webSocket'];
    lodash_1.default.extend(ret, lodash_1.default.pick(options, noAnnotationRequiredFields));
    return ret;
}
exports._restoreMatcherOptionsTypes = _restoreMatcherOptionsTypes;
function onNetEvent(opts) {
    return __awaiter(this, void 0, void 0, function () {
        var state, socket, getFixture, args, eventName, frame;
        return __generator(this, function (_a) {
            state = opts.state, socket = opts.socket, getFixture = opts.getFixture, args = opts.args, eventName = opts.eventName, frame = opts.frame;
            debug('received driver event %o', { eventName: eventName, args: args });
            switch (eventName) {
                case 'route:added':
                    return [2 /*return*/, _onRouteAdded(state, getFixture, frame)];
                case 'http:request:continue':
                    return [2 /*return*/, intercept_request_1.onRequestContinue(state, frame, socket)];
                case 'http:response:continue':
                    return [2 /*return*/, intercept_response_1.onResponseContinue(state, frame)];
                default:
                    throw new Error("Unrecognized net event: " + eventName);
            }
            return [2 /*return*/];
        });
    });
}
exports.onNetEvent = onNetEvent;
