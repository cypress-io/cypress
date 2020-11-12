"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var network_1 = require("@packages/network");
var net_stubbing_1 = require("@packages/net-stubbing");
var debug_1 = __importDefault(require("debug"));
var debug = debug_1.default('cypress:proxy:http:request-middleware');
var LogRequest = function () {
    debug('proxying request %o', {
        req: lodash_1.default.pick(this.req, 'method', 'proxiedUrl', 'headers'),
    });
    this.next();
};
var MaybeEndRequestWithBufferedResponse = function () {
    var buffer = this.buffers.take(this.req.proxiedUrl);
    if (buffer) {
        debug('got a buffer %o', lodash_1.default.pick(buffer, 'url'));
        this.res.wantsInjection = 'full';
        return this.onResponse(buffer.response, buffer.stream);
    }
    this.next();
};
var RedirectToClientRouteIfUnloaded = function () {
    // if we have an unload header it means our parent app has been navigated away
    // directly and we need to automatically redirect to the clientRoute
    if (this.req.cookies['__cypress.unload']) {
        this.res.redirect(this.config.clientRoute);
        return this.end();
    }
    this.next();
};
var EndRequestsToBlockedHosts = function () {
    var blockHosts = this.config.blockHosts;
    if (blockHosts) {
        var matches = network_1.blocked.matches(this.req.proxiedUrl, blockHosts);
        if (matches) {
            this.res.set('x-cypress-matched-blocked-host', matches);
            debug('blocking request %o', {
                url: this.req.proxiedUrl,
                matches: matches,
            });
            this.res.status(503).end();
            return this.end();
        }
    }
    this.next();
};
var StripUnsupportedAcceptEncoding = function () {
    // Cypress can only support plaintext or gzip, so make sure we don't request anything else
    var acceptEncoding = this.req.headers['accept-encoding'];
    if (acceptEncoding) {
        if (acceptEncoding.includes('gzip')) {
            this.req.headers['accept-encoding'] = 'gzip';
        }
        else {
            delete this.req.headers['accept-encoding'];
        }
    }
    this.next();
};
function reqNeedsBasicAuthHeaders(req, _a) {
    var auth = _a.auth, origin = _a.origin;
    //if we have auth headers, this request matches our origin, protection space, and the user has not supplied auth headers
    return auth && !req.headers['authorization'] && network_1.cors.urlMatchesOriginProtectionSpace(req.proxiedUrl, origin);
}
var MaybeSetBasicAuthHeaders = function () {
    var remoteState = this.getRemoteState();
    if (remoteState.auth && reqNeedsBasicAuthHeaders(this.req, remoteState)) {
        var auth = remoteState.auth;
        var base64 = Buffer.from(auth.username + ":" + auth.password).toString('base64');
        this.req.headers['authorization'] = "Basic " + base64;
    }
    this.next();
};
var SendRequestOutgoing = function () {
    var _this = this;
    var requestOptions = {
        timeout: this.req.responseTimeout,
        strictSSL: false,
        followRedirect: this.req.followRedirect || false,
        retryIntervals: [0, 100, 200, 200],
        url: this.req.proxiedUrl,
    };
    var requestBodyBuffered = !!this.req.body;
    var _a = this.getRemoteState(), strategy = _a.strategy, origin = _a.origin, fileServer = _a.fileServer;
    if (strategy === 'file' && requestOptions.url.startsWith(origin)) {
        this.req.headers['x-cypress-authorization'] = this.getFileServerToken();
        requestOptions.url = requestOptions.url.replace(origin, fileServer);
    }
    if (requestBodyBuffered) {
        lodash_1.default.assign(requestOptions, lodash_1.default.pick(this.req, 'method', 'body', 'headers'));
    }
    var req = this.request.create(requestOptions);
    req.on('error', this.onError);
    req.on('response', function (incomingRes) { return _this.onResponse(incomingRes, req); });
    this.req.on('aborted', function () {
        debug('request aborted');
        req.abort();
    });
    if (!requestBodyBuffered) {
        // pipe incoming request body, headers to new request
        this.req.pipe(req);
    }
    this.outgoingReq = req;
};
exports.default = {
    LogRequest: LogRequest,
    MaybeEndRequestWithBufferedResponse: MaybeEndRequestWithBufferedResponse,
    InterceptRequest: net_stubbing_1.InterceptRequest,
    RedirectToClientRouteIfUnloaded: RedirectToClientRouteIfUnloaded,
    EndRequestsToBlockedHosts: EndRequestsToBlockedHosts,
    StripUnsupportedAcceptEncoding: StripUnsupportedAcceptEncoding,
    MaybeSetBasicAuthHeaders: MaybeSetBasicAuthHeaders,
    SendRequestOutgoing: SendRequestOutgoing,
};
