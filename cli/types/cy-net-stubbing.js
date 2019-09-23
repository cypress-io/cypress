"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RequestState;
(function (RequestState) {
    RequestState[RequestState["Received"] = 0] = "Received";
    RequestState[RequestState["Intercepted"] = 1] = "Intercepted";
    RequestState[RequestState["ResponseReceived"] = 2] = "ResponseReceived";
    RequestState[RequestState["ResponseIntercepted"] = 3] = "ResponseIntercepted";
    RequestState[RequestState["Completed"] = 4] = "Completed";
})(RequestState = exports.RequestState || (exports.RequestState = {}));
