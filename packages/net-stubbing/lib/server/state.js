"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
function state() {
    return {
        requests: {},
        routes: [],
        reset: function () {
            // clean up requests that are still pending
            for (var requestId in this.requests) {
                var res = this.requests[requestId].res;
                res.removeAllListeners('finish');
                res.removeAllListeners('error');
                res.on('error', lodash_1.noop);
                res.destroy();
            }
            this.requests = {};
            this.routes = [];
        },
    };
}
exports.state = state;
