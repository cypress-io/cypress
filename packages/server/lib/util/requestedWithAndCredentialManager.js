"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestedWithAndCredentialManager = void 0;
const tslib_1 = require("tslib");
const md5_1 = tslib_1.__importDefault(require("md5"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const debug = (0, debug_1.default)('cypress:server:util:resource-type-and-credential');
const hashUrl = (url) => {
    return (0, md5_1.default)(decodeURIComponent(url));
};
// leverage a singleton Map throughout the server to prevent clashes with this context bindings
const _appliedCredentialByUrlAndResourceMap = new Map();
class RequestedWithAndCredentialManagerClass {
    get(url, optionalRequestedWith) {
        const hashKey = hashUrl(url);
        debug(`credentials request received for request url ${url}, hashKey ${hashKey}`);
        let value;
        const credentialsObj = _appliedCredentialByUrlAndResourceMap.get(hashKey);
        if (credentialsObj) {
            // remove item from queue
            value = credentialsObj === null || credentialsObj === void 0 ? void 0 : credentialsObj.shift();
            debug(`credential value found ${value}`);
        }
        // if value is undefined for any reason, apply defaults and assume xhr if no optionalRequestedWith
        // optionalRequestedWith should be provided with CDP based browsers, so at least we have a fallback that is more accurate
        if (value === undefined) {
            value = {
                requestedWith: optionalRequestedWith || 'xhr',
                credentialStatus: optionalRequestedWith === 'fetch' ? 'same-origin' : false,
            };
        }
        return value;
    }
    set({ url, requestedWith, credentialStatus, }) {
        const hashKey = hashUrl(url);
        debug(`credentials request stored for request url ${url}, requestedWith ${requestedWith}, hashKey ${hashKey}`);
        let urlHashValue = _appliedCredentialByUrlAndResourceMap.get(hashKey);
        if (!urlHashValue) {
            _appliedCredentialByUrlAndResourceMap.set(hashKey, [{
                    requestedWith,
                    credentialStatus,
                }]);
        }
        else {
            urlHashValue.push({
                requestedWith,
                credentialStatus,
            });
        }
    }
    clear() {
        _appliedCredentialByUrlAndResourceMap.clear();
    }
}
// export as a singleton
exports.requestedWithAndCredentialManager = new RequestedWithAndCredentialManagerClass();
