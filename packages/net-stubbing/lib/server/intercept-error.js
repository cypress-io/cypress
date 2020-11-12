"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var util_1 = require("./util");
var errors_1 = __importDefault(require("@packages/server/lib/errors"));
var debug = debug_1.default('cypress:net-stubbing:server:intercept-error');
exports.InterceptError = function () {
    var backendRequest = this.netStubbingState.requests[this.req.requestId];
    if (!backendRequest) {
        // the original request was not intercepted, nothing to do
        return this.next();
    }
    debug('intercepting error %o', { req: this.req, backendRequest: backendRequest });
    // this may get set back to `true` by another route
    backendRequest.waitForResponseContinue = false;
    backendRequest.continueResponse = this.next;
    var frame = {
        routeHandlerId: backendRequest.route.handlerId,
        requestId: backendRequest.requestId,
        error: errors_1.default.clone(this.error),
    };
    util_1.emit(this.socket, 'http:request:complete', frame);
    this.next();
};
