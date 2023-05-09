"use strict";
/// <reference types='chrome'/>
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdpAutomation = exports.normalizeResourceType = exports.isHostOnlyCookie = exports.screencastOpts = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const network_1 = require("@packages/network");
const debug_1 = tslib_1.__importDefault(require("debug"));
const url_1 = require("url");
const util_1 = require("../automation/util");
const debugVerbose = (0, debug_1.default)('cypress-verbose:server:browsers:cdp_automation');
function screencastOpts(everyNthFrame = Number(process.env.CYPRESS_EVERY_NTH_FRAME || 5)) {
    return {
        format: 'jpeg',
        everyNthFrame,
    };
}
exports.screencastOpts = screencastOpts;
function convertSameSiteExtensionToCdp(str) {
    return str ? ({
        'no_restriction': 'None',
        'lax': 'Lax',
        'strict': 'Strict',
    })[str] : str;
}
function convertSameSiteCdpToExtension(str) {
    if (lodash_1.default.isUndefined(str)) {
        return str;
    }
    if (str === 'None') {
        return 'no_restriction';
    }
    return str.toLowerCase();
}
// without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
function isHostOnlyCookie(cookie) {
    if (cookie.domain[0] === '.')
        return false;
    const parsedDomain = network_1.cors.parseDomain(cookie.domain);
    // make every cookie non-hostOnly
    // unless it's a top-level domain (localhost, ...) or IP address
    return parsedDomain && parsedDomain.tld !== cookie.domain;
}
exports.isHostOnlyCookie = isHostOnlyCookie;
const normalizeGetCookieProps = (cookie) => {
    if (cookie.expires === -1) {
        // @ts-ignore
        delete cookie.expires;
    }
    if (isHostOnlyCookie(cookie)) {
        // @ts-ignore
        cookie.hostOnly = true;
    }
    // @ts-ignore
    cookie.sameSite = convertSameSiteCdpToExtension(cookie.sameSite);
    // @ts-ignore
    cookie.expirationDate = cookie.expires;
    // @ts-ignore
    delete cookie.expires;
    // @ts-ignore
    return cookie;
};
const normalizeGetCookies = (cookies) => {
    return lodash_1.default.map(cookies, normalizeGetCookieProps);
};
const normalizeSetCookieProps = (cookie) => {
    // this logic forms a SetCookie request that will be received by Chrome
    // see MakeCookieFromProtocolValues for information on how this cookie data will be parsed
    // @see https://cs.chromium.org/chromium/src/content/browser/devtools/protocol/network_handler.cc?l=246&rcl=786a9194459684dc7a6fded9cabfc0c9b9b37174
    const setCookieRequest = (0, lodash_1.default)({
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: convertSameSiteExtensionToCdp(cookie.sameSite),
        expires: cookie.expirationDate,
    })
        // Network.setCookie will error on any undefined/null parameters
        .omitBy(lodash_1.default.isNull)
        .omitBy(lodash_1.default.isUndefined)
        // set name and value at the end to get the correct typing
        .extend({
        name: cookie.name || '',
        value: cookie.value || '',
    })
        .value();
    // without this logic, a cookie being set on 'foo.com' will only be set for 'foo.com', not other subdomains
    if (!cookie.hostOnly && isHostOnlyCookie(cookie)) {
        setCookieRequest.domain = `.${cookie.domain}`;
    }
    if (cookie.hostOnly && !isHostOnlyCookie(cookie)) {
        // @ts-ignore
        delete cookie.hostOnly;
    }
    if (setCookieRequest.name.startsWith('__Host-')) {
        setCookieRequest.url = `https://${cookie.domain}`;
        delete setCookieRequest.domain;
    }
    return setCookieRequest;
};
const normalizeResourceType = (resourceType) => {
    resourceType = resourceType ? resourceType.toLowerCase() : 'unknown';
    if (validResourceTypes.includes(resourceType)) {
        return resourceType;
    }
    if (resourceType === 'img') {
        return 'image';
    }
    return ffToStandardResourceTypeMap[resourceType] || 'other';
};
exports.normalizeResourceType = normalizeResourceType;
// the intersection of what's valid in CDP and what's valid in FFCDP
// Firefox: https://searchfox.org/mozilla-central/rev/98a9257ca2847fad9a19631ac76199474516b31e/remote/cdp/domains/parent/Network.jsm#22
// CDP: https://chromedevtools.github.io/devtools-protocol/tot/Network/#type-ResourceType
const validResourceTypes = ['fetch', 'xhr', 'websocket', 'stylesheet', 'script', 'image', 'font', 'cspviolationreport', 'ping', 'manifest', 'other'];
const ffToStandardResourceTypeMap = {
    'img': 'image',
    'csp': 'cspviolationreport',
    'webmanifest': 'manifest',
};
class CdpAutomation {
    constructor(sendDebuggerCommandFn, onFn, sendCloseCommandFn, automation) {
        this.sendDebuggerCommandFn = sendDebuggerCommandFn;
        this.onFn = onFn;
        this.sendCloseCommandFn = sendCloseCommandFn;
        this.automation = automation;
        this.onNetworkRequestWillBeSent = (params) => {
            var _a, _b;
            debugVerbose('received networkRequestWillBeSent %o', params);
            let url = params.request.url;
            // in Firefox, the hash is incorrectly included in the URL: https://bugzilla.mozilla.org/show_bug.cgi?id=1715366
            if (url.includes('#'))
                url = url.slice(0, url.indexOf('#'));
            // Filter out "data:" urls from being cached - fixes: https://github.com/cypress-io/cypress/issues/17853
            // Chrome sends `Network.requestWillBeSent` events with data urls which won't actually be fetched
            // Example data url: "data:font/woff;base64,<base64 encoded string>"
            if (url.startsWith('data:')) {
                debugVerbose('skipping `data:` url %s', url);
                return;
            }
            // Firefox: https://searchfox.org/mozilla-central/rev/98a9257ca2847fad9a19631ac76199474516b31e/remote/cdp/domains/parent/Network.jsm#397
            // Firefox lacks support for urlFragment and initiator, two nice-to-haves
            const browserPreRequest = {
                requestId: params.requestId,
                method: params.request.method,
                url,
                headers: params.request.headers,
                resourceType: (0, exports.normalizeResourceType)(params.type),
                originalResourceType: params.type,
            };
            (_b = (_a = this.automation).onBrowserPreRequest) === null || _b === void 0 ? void 0 : _b.call(_a, browserPreRequest);
        };
        this.onResponseReceived = (params) => {
            var _a, _b;
            const browserResponseReceived = {
                requestId: params.requestId,
                status: params.response.status,
                headers: params.response.headers,
            };
            (_b = (_a = this.automation).onRequestEvent) === null || _b === void 0 ? void 0 : _b.call(_a, 'response:received', browserResponseReceived);
        };
        this.getAllCookies = (filter) => {
            return this.sendDebuggerCommandFn('Network.getAllCookies')
                .then((result) => {
                return normalizeGetCookies(result.cookies)
                    .filter((cookie) => {
                    const matches = (0, util_1.cookieMatches)(cookie, filter);
                    debugVerbose('cookie matches filter? %o', { matches, cookie, filter });
                    return matches;
                });
            });
        };
        this.getCookiesByUrl = (url) => {
            return this.sendDebuggerCommandFn('Network.getCookies', {
                urls: [url],
            })
                .then((result) => {
                const isLocalhost = network_1.uri.isLocalhost(new url_1.URL(url));
                return normalizeGetCookies(result.cookies)
                    .filter((cookie) => {
                    // Chrome returns all cookies for a URL, even if they wouldn't normally
                    // be sent with a request. This standardizes it by filtering out ones
                    // that are secure but not on a secure context
                    // localhost is considered a secure context (even when http:)
                    // and it's required for cross origin support when visiting a secondary
                    // origin so that all its cookies are sent.
                    return !(cookie.secure && url.startsWith('http:') && !isLocalhost);
                });
            });
        };
        this.getCookie = (filter) => {
            return this.getAllCookies(filter)
                .then((cookies) => {
                return lodash_1.default.get(cookies, 0, null);
            });
        };
        this.onRequest = (message, data) => {
            let setCookie;
            switch (message) {
                case 'get:cookies':
                    if (data.url) {
                        return this.getCookiesByUrl(data.url);
                    }
                    return this.getAllCookies(data);
                case 'get:cookie':
                    return this.getCookie(data);
                case 'set:cookie':
                    setCookie = normalizeSetCookieProps(data);
                    return this.sendDebuggerCommandFn('Network.setCookie', setCookie)
                        .then((result) => {
                        if (!result.success) {
                            // i wish CDP provided some more detail here, but this is really it in v1.3
                            // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
                            throw new Error(`Network.setCookie failed to set cookie: ${JSON.stringify(setCookie)}`);
                        }
                        return this.getCookie(data);
                    });
                case 'add:cookies':
                    setCookie = data.map((cookie) => normalizeSetCookieProps(cookie));
                    return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie });
                case 'set:cookies':
                    setCookie = data.map((cookie) => normalizeSetCookieProps(cookie));
                    return this.sendDebuggerCommandFn('Network.clearBrowserCookies')
                        .then(() => {
                        return this.sendDebuggerCommandFn('Network.setCookies', { cookies: setCookie });
                    });
                case 'clear:cookie':
                    return this.getCookie(data)
                        // always resolve with the value of the removed cookie. also, getting
                        // the cookie via CDP first will ensure that we send a cookie `domain`
                        // to CDP that matches the cookie domain that is really stored
                        .then((cookieToBeCleared) => {
                        if (!cookieToBeCleared) {
                            return cookieToBeCleared;
                        }
                        return this.sendDebuggerCommandFn('Network.deleteCookies', lodash_1.default.pick(cookieToBeCleared, 'name', 'domain'))
                            .then(() => {
                            return cookieToBeCleared;
                        });
                    });
                case 'clear:cookies':
                    return bluebird_1.default.mapSeries(data, async (cookie) => {
                        // resolve with the value of the removed cookie
                        // also, getting the cookie via CDP first will ensure that we send a cookie `domain` to CDP
                        // that matches the cookie domain that is really stored
                        const cookieToBeCleared = await this.getCookie(cookie);
                        if (!cookieToBeCleared)
                            return;
                        await this.sendDebuggerCommandFn('Network.deleteCookies', lodash_1.default.pick(cookieToBeCleared, 'name', 'domain'));
                        return cookieToBeCleared;
                    });
                case 'is:automation:client:connected':
                    return true;
                case 'remote:debugger:protocol':
                    return this.sendDebuggerCommandFn(data.command, data.params);
                case 'take:screenshot':
                    return this.sendDebuggerCommandFn('Page.captureScreenshot', { format: 'png' })
                        .catch((err) => {
                        throw new Error(`The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n${err.message}`);
                    })
                        .then(({ data }) => {
                        return `data:image/png;base64,${data}`;
                    });
                case 'reset:browser:state':
                    return Promise.all([
                        this.sendDebuggerCommandFn('Storage.clearDataForOrigin', { origin: '*', storageTypes: 'all' }),
                        this.sendDebuggerCommandFn('Network.clearBrowserCache'),
                    ]);
                case 'reset:browser:tabs:for:next:test':
                    return this.sendCloseCommandFn(data.shouldKeepTabOpen);
                case 'focus:browser:window':
                    return this.sendDebuggerCommandFn('Page.bringToFront');
                case 'get:heap:size:limit':
                    return this.sendDebuggerCommandFn('Runtime.evaluate', { expression: 'performance.memory.jsHeapSizeLimit' });
                case 'collect:garbage':
                    return this.sendDebuggerCommandFn('HeapProfiler.collectGarbage');
                default:
                    throw new Error(`No automation handler registered for: '${message}'`);
            }
        };
        onFn('Network.requestWillBeSent', this.onNetworkRequestWillBeSent);
        onFn('Network.responseReceived', this.onResponseReceived);
    }
    async startVideoRecording(writeVideoFrame, screencastOpts) {
        this.onFn('Page.screencastFrame', async (e) => {
            writeVideoFrame(Buffer.from(e.data, 'base64'));
            await this.sendDebuggerCommandFn('Page.screencastFrameAck', { sessionId: e.sessionId });
        });
        await this.sendDebuggerCommandFn('Page.startScreencast', screencastOpts);
    }
    static async create(sendDebuggerCommandFn, onFn, sendCloseCommandFn, automation) {
        const cdpAutomation = new CdpAutomation(sendDebuggerCommandFn, onFn, sendCloseCommandFn, automation);
        await sendDebuggerCommandFn('Network.enable', {
            maxTotalBufferSize: 0,
            maxResourceBufferSize: 0,
            maxPostDataSize: 0,
        });
        return cdpAutomation;
    }
}
exports.CdpAutomation = CdpAutomation;
