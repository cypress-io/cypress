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
var minimatch_1 = __importDefault(require("minimatch"));
var url_1 = __importDefault(require("url"));
var types_1 = require("../types");
var util_1 = require("./util");
var debug = debug_1.default('cypress:net-stubbing:server:intercept-request');
/**
 * Returns `true` if `req` matches all supplied properties on `routeMatcher`, `false` otherwise.
 */
function _doesRouteMatch(routeMatcher, req) {
    var matchable = _getMatchableForRequest(req);
    // get a list of all the fields which exist where a rule needs to be succeed
    var stringMatcherFields = util_1.getAllStringMatcherFields(routeMatcher);
    var booleanFields = lodash_1.default.filter(lodash_1.default.keys(routeMatcher), lodash_1.default.partial(lodash_1.default.includes, ['https', 'webSocket']));
    var numberFields = lodash_1.default.filter(lodash_1.default.keys(routeMatcher), lodash_1.default.partial(lodash_1.default.includes, ['port']));
    for (var i = 0; i < stringMatcherFields.length; i++) {
        var field = stringMatcherFields[i];
        var matcher = lodash_1.default.get(routeMatcher, field);
        var value = lodash_1.default.get(matchable, field, '');
        if (typeof value !== 'string') {
            value = String(value);
        }
        if (matcher.test) {
            if (!matcher.test(value)) {
                return false;
            }
            continue;
        }
        if (field === 'url') {
            if (value.includes(matcher)) {
                continue;
            }
        }
        if (!minimatch_1.default(value, matcher, { matchBase: true })) {
            return false;
        }
    }
    for (var i = 0; i < booleanFields.length; i++) {
        var field = booleanFields[i];
        var matcher = lodash_1.default.get(routeMatcher, field);
        var value = lodash_1.default.get(matchable, field);
        if (matcher !== value) {
            return false;
        }
    }
    for (var i = 0; i < numberFields.length; i++) {
        var field = numberFields[i];
        var matcher = lodash_1.default.get(routeMatcher, field);
        var value = lodash_1.default.get(matchable, field);
        if (matcher.length) {
            if (!matcher.includes(value)) {
                return false;
            }
            continue;
        }
        if (matcher !== value) {
            return false;
        }
    }
    return true;
}
exports._doesRouteMatch = _doesRouteMatch;
function _getMatchableForRequest(req) {
    var matchable = lodash_1.default.pick(req, ['headers', 'method', 'webSocket']);
    var authorization = req.headers['authorization'];
    if (authorization) {
        var _a = authorization.split(' ', 2), mechanism = _a[0], credentials = _a[1];
        if (mechanism && credentials && mechanism.toLowerCase() === 'basic') {
            var _b = Buffer.from(credentials, 'base64').toString().split(':', 2), username = _b[0], password = _b[1];
            matchable.auth = { username: username, password: password };
        }
    }
    var proxiedUrl = url_1.default.parse(req.proxiedUrl, true);
    lodash_1.default.assign(matchable, lodash_1.default.pick(proxiedUrl, ['hostname', 'path', 'pathname', 'port', 'query']));
    matchable.url = req.proxiedUrl;
    matchable.https = proxiedUrl.protocol && (proxiedUrl.protocol.indexOf('https') === 0);
    if (!matchable.port) {
        matchable.port = matchable.https ? 443 : 80;
    }
    return matchable;
}
exports._getMatchableForRequest = _getMatchableForRequest;
function _getRouteForRequest(routes, req, prevRoute) {
    var possibleRoutes = prevRoute ? routes.slice(lodash_1.default.findIndex(routes, prevRoute) + 1) : routes;
    return lodash_1.default.find(possibleRoutes, function (route) {
        return _doesRouteMatch(route.routeMatcher, req);
    });
}
/**
 * Called when a new request is received in the proxy layer.
 * @param project
 * @param req
 * @param res
 * @param cb Can be called to resume the proxy's normal behavior. If `res` is not handled and this is not called, the request will hang.
 */
exports.InterceptRequest = function () {
    var route = _getRouteForRequest(this.netStubbingState.routes, this.req);
    if (!route) {
        // not intercepted, carry on normally...
        return this.next();
    }
    var requestId = lodash_1.default.uniqueId('interceptedRequest');
    debug('intercepting request %o', { requestId: requestId, route: route, req: lodash_1.default.pick(this.req, 'url') });
    var request = {
        requestId: requestId,
        route: route,
        continueRequest: this.next,
        onResponse: this.onResponse,
        req: this.req,
        res: this.res,
    };
    // attach requestId to the original req object for later use
    this.req.requestId = requestId;
    this.netStubbingState.requests[requestId] = request;
    _interceptRequest(this.netStubbingState, request, route, this.socket);
};
function _interceptRequest(state, request, route, socket) {
    var notificationOnly = !route.hasInterceptor;
    var frame = {
        routeHandlerId: route.handlerId,
        requestId: request.req.requestId,
        req: lodash_1.default.extend(lodash_1.default.pick(request.req, types_1.SERIALIZABLE_REQ_PROPS), {
            url: request.req.proxiedUrl,
        }),
        notificationOnly: notificationOnly,
    };
    request.res.once('finish', function () {
        util_1.emit(socket, 'http:request:complete', {
            requestId: request.requestId,
            routeHandlerId: route.handlerId,
        });
        debug('request/response finished, cleaning up %o', { requestId: request.requestId });
        delete state.requests[request.requestId];
    });
    var emitReceived = function () {
        util_1.emit(socket, 'http:request:received', frame);
    };
    if (route.staticResponse) {
        emitReceived();
        return util_1.sendStaticResponse(request.res, route.staticResponse, request.onResponse);
    }
    var ensureBody = function (cb) {
        if (frame.req.body) {
            return cb();
        }
        request.req.pipe(concat_stream_1.default(function (reqBody) {
            request.req.body = frame.req.body = reqBody.toString();
            cb();
        }));
    };
    if (notificationOnly) {
        return ensureBody(function () {
            emitReceived();
            var nextRoute = getNextRoute(state, request.req, frame.routeHandlerId);
            if (!nextRoute) {
                return request.continueRequest();
            }
            _interceptRequest(state, request, nextRoute, socket);
        });
    }
    ensureBody(emitReceived);
}
/**
 * If applicable, return the route that is next in line after `prevRouteHandlerId` to handle `req`.
 */
function getNextRoute(state, req, prevRouteHandlerId) {
    var prevRoute = lodash_1.default.find(state.routes, { handlerId: prevRouteHandlerId });
    if (!prevRoute) {
        return;
    }
    return _getRouteForRequest(state.routes, req, prevRoute);
}
function onRequestContinue(state, frame, socket) {
    return __awaiter(this, void 0, void 0, function () {
        var backendRequest, nextRoute;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    backendRequest = state.requests[frame.requestId];
                    if (!backendRequest) {
                        debug('onRequestContinue received but no backendRequest exists %o', { frame: frame });
                        return [2 /*return*/];
                    }
                    frame.req.url = url_1.default.resolve(backendRequest.req.proxiedUrl, frame.req.url);
                    // modify the original paused request object using what the client returned
                    lodash_1.default.assign(backendRequest.req, lodash_1.default.pick(frame.req, types_1.SERIALIZABLE_REQ_PROPS));
                    // proxiedUrl is used to initialize the new request
                    backendRequest.req.proxiedUrl = frame.req.url;
                    // update problematic headers
                    // update content-length if available
                    if (backendRequest.req.headers['content-length'] && frame.req.body) {
                        backendRequest.req.headers['content-length'] = frame.req.body.length;
                    }
                    if (frame.hasResponseHandler) {
                        backendRequest.waitForResponseContinue = true;
                    }
                    if (frame.tryNextRoute) {
                        nextRoute = getNextRoute(state, backendRequest.req, frame.routeHandlerId);
                        if (!nextRoute) {
                            return [2 /*return*/, backendRequest.continueRequest()];
                        }
                        return [2 /*return*/, _interceptRequest(state, backendRequest, nextRoute, socket)];
                    }
                    if (!frame.staticResponse) return [3 /*break*/, 2];
                    return [4 /*yield*/, util_1.setResponseFromFixture(backendRequest.route.getFixture, frame.staticResponse)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, util_1.sendStaticResponse(backendRequest.res, frame.staticResponse, backendRequest.onResponse)];
                case 2:
                    backendRequest.continueRequest();
                    return [2 /*return*/];
            }
        });
    });
}
exports.onRequestContinue = onRequestContinue;
