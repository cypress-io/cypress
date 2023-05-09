"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteStates = void 0;
const tslib_1 = require("tslib");
const network_1 = require("@packages/network");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const DEFAULT_DOMAIN_NAME = 'localhost';
const fullyQualifiedRe = /^https?:\/\//;
const debug = (0, debug_1.default)('cypress:server:remote-states');
/**
 * Class to maintain and manage the remote states of the server.
 *
 * Example file remote state:
 * {
 *   auth: {
 *     username: 'name'
 *     password: 'pass'
 *   }
 *   origin: "http://localhost:2020"
 *   fileServer: "http://localhost:2021"
 *   strategy: "file"
 *   domainName: "localhost"
 *   props: null
 * }
 *
 * Example http remote state:
 * {
 *   auth: {
 *     username: 'name'
 *     password: 'pass'
 *   }
 *   origin: "https://foo.google.com"
 *   fileServer: null
 *   strategy: "http"
 *   domainName: "google.com"
 *   props: {
 *     port: 443
 *     tld: "com"
 *     domain: "google"
 *     protocol: "https"
 *   }
 * }
 */
class RemoteStates {
    constructor(configure) {
        this.remoteStates = new Map();
        this.primaryOriginKey = '';
        this.currentOriginKey = '';
        this.configure = configure;
    }
    get(url) {
        const state = this.remoteStates.get(network_1.cors.getSuperDomainOrigin(url));
        debug('getting remote state: %o for: %s', state, url);
        return lodash_1.default.cloneDeep(state);
    }
    getPrimary() {
        const state = Array.from(this.remoteStates.entries())[0][1];
        debug('getting primary remote state: %o', state);
        return state;
    }
    isPrimarySuperDomainOrigin(url) {
        return this.primaryOriginKey === network_1.cors.getSuperDomainOrigin(url);
    }
    reset() {
        debug('resetting remote state');
        const stateArray = Array.from(this.remoteStates.entries());
        // reset the remoteStates and originStack to the primary
        this.remoteStates = new Map(stateArray[0] ? [stateArray[0]] : []);
        this.currentOriginKey = this.primaryOriginKey;
    }
    current() {
        return this.get(this.currentOriginKey);
    }
    set(urlOrState, options = {}, isPrimarySuperDomainOrigin = true) {
        let state;
        if (lodash_1.default.isString(urlOrState)) {
            const remoteOrigin = network_1.uri.origin(urlOrState);
            const remoteProps = network_1.cors.parseUrlIntoHostProtocolDomainTldPort(remoteOrigin);
            if ((urlOrState === '<root>') || !fullyQualifiedRe.test(urlOrState)) {
                state = {
                    auth: options.auth,
                    origin: `http://${DEFAULT_DOMAIN_NAME}:${this.config.serverPort}`,
                    strategy: 'file',
                    fileServer: lodash_1.default.compact([`http://${DEFAULT_DOMAIN_NAME}`, this.config.fileServerPort]).join(':'),
                    domainName: DEFAULT_DOMAIN_NAME,
                    props: null,
                };
            }
            else {
                state = {
                    auth: options.auth,
                    origin: remoteOrigin,
                    strategy: 'http',
                    fileServer: null,
                    domainName: network_1.cors.getDomainNameFromParsedHost(remoteProps),
                    props: remoteProps,
                };
            }
        }
        else {
            state = urlOrState;
        }
        const remoteOrigin = network_1.cors.getSuperDomainOrigin(state.origin);
        this.currentOriginKey = remoteOrigin;
        if (isPrimarySuperDomainOrigin) {
            // convert map to array
            const stateArray = Array.from(this.remoteStates.entries());
            // set the primary remote state and convert back to map
            stateArray[0] = [remoteOrigin, state];
            this.remoteStates = new Map(stateArray);
            this.primaryOriginKey = remoteOrigin;
        }
        else {
            this.remoteStates.set(remoteOrigin, state);
        }
        debug('setting remote state %o for %s', state, remoteOrigin);
        return this.get(remoteOrigin);
    }
    get config() {
        if (!this._config) {
            this._config = this.configure();
        }
        return this._config;
    }
}
exports.RemoteStates = RemoteStates;
