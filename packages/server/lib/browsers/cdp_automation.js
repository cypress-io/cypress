"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var network_1 = require("@packages/network");
var debug_1 = __importDefault(require("debug"));
var debugVerbose = debug_1.default('cypress-verbose:server:browsers:cdp_automation');
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
exports._domainIsWithinSuperdomain = function (domain, suffix) {
    var suffixParts = suffix.split('.').filter(lodash_1.default.identity);
    var domainParts = domain.split('.').filter(lodash_1.default.identity);
    return lodash_1.default.isEqual(suffixParts, domainParts.slice(domainParts.length - suffixParts.length));
};
exports._cookieMatches = function (cookie, filter) {
    if (filter.domain && !(cookie.domain && exports._domainIsWithinSuperdomain(cookie.domain, filter.domain))) {
        return false;
    }
    if (filter.path && filter.path !== cookie.path) {
        return false;
    }
    if (filter.name && filter.name !== cookie.name) {
        return false;
    }
    return true;
};
exports.CdpAutomation = function (sendDebuggerCommandFn) {
    var normalizeGetCookieProps = function (cookie) {
        if (cookie.expires === -1) {
            delete cookie.expires;
        }
        // @ts-ignore
        cookie.sameSite = convertSameSiteCdpToExtension(cookie.sameSite);
        // @ts-ignore
        cookie.expirationDate = cookie.expires;
        delete cookie.expires;
        // @ts-ignore
        return cookie;
    };
    var normalizeGetCookies = function (cookies) {
        return lodash_1.default.map(cookies, normalizeGetCookieProps);
    };
    var normalizeSetCookieProps = function (cookie) {
        // this logic forms a SetCookie request that will be received by Chrome
        // see MakeCookieFromProtocolValues for information on how this cookie data will be parsed
        // @see https://cs.chromium.org/chromium/src/content/browser/devtools/protocol/network_handler.cc?l=246&rcl=786a9194459684dc7a6fded9cabfc0c9b9b37174
        var setCookieRequest = lodash_1.default({
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
        if (!cookie.hostOnly && cookie.domain[0] !== '.') {
            var parsedDomain = network_1.cors.parseDomain(cookie.domain);
            // normally, a non-hostOnly cookie should be prefixed with a .
            // so if it's not a top-level domain (localhost, ...) or IP address
            // prefix it with a . so it becomes a non-hostOnly cookie
            if (parsedDomain && parsedDomain.tld !== cookie.domain) {
                setCookieRequest.domain = "." + cookie.domain;
            }
        }
        if (setCookieRequest.name.startsWith('__Host-')) {
            setCookieRequest.url = "https://" + cookie.domain;
            delete setCookieRequest.domain;
        }
        return setCookieRequest;
    };
    var getAllCookies = function (filter) {
        return sendDebuggerCommandFn('Network.getAllCookies')
            .then(function (result) {
            return normalizeGetCookies(result.cookies)
                .filter(function (cookie) {
                var matches = exports._cookieMatches(cookie, filter);
                debugVerbose('cookie matches filter? %o', { matches: matches, cookie: cookie, filter: filter });
                return matches;
            });
        });
    };
    var getCookiesByUrl = function (url) {
        return sendDebuggerCommandFn('Network.getCookies', {
            urls: [url],
        })
            .then(function (result) {
            return normalizeGetCookies(result.cookies);
        });
    };
    var getCookie = function (filter) {
        return getAllCookies(filter)
            .then(function (cookies) {
            return lodash_1.default.get(cookies, 0, null);
        });
    };
    var onRequest = function (message, data) {
        var setCookie;
        switch (message) {
            case 'get:cookies':
                if (data.url) {
                    return getCookiesByUrl(data.url);
                }
                return getAllCookies(data);
            case 'get:cookie':
                return getCookie(data);
            case 'set:cookie':
                setCookie = normalizeSetCookieProps(data);
                return sendDebuggerCommandFn('Network.setCookie', setCookie)
                    .then(function (result) {
                    if (!result.success) {
                        // i wish CDP provided some more detail here, but this is really it in v1.3
                        // @see https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie
                        throw new Error("Network.setCookie failed to set cookie: " + JSON.stringify(setCookie));
                    }
                    return getCookie(data);
                });
            case 'clear:cookie':
                return getCookie(data)
                    // tap, so we can resolve with the value of the removed cookie
                    // also, getting the cookie via CDP first will ensure that we send a cookie `domain` to CDP
                    // that matches the cookie domain that is really stored
                    .tap(function (cookieToBeCleared) {
                    if (!cookieToBeCleared) {
                        return;
                    }
                    return sendDebuggerCommandFn('Network.deleteCookies', lodash_1.default.pick(cookieToBeCleared, 'name', 'domain'));
                });
            case 'is:automation:client:connected':
                return true;
            case 'remote:debugger:protocol':
                return sendDebuggerCommandFn(data.command, data.params);
            case 'take:screenshot':
                return sendDebuggerCommandFn('Page.captureScreenshot', { format: 'png' })
                    .catch(function (err) {
                    throw new Error("The browser responded with an error when Cypress attempted to take a screenshot.\n\nDetails:\n" + err.message);
                })
                    .then(function (_a) {
                    var data = _a.data;
                    return "data:image/png;base64," + data;
                });
            default:
                throw new Error("No automation handler registered for: '" + message + "'");
        }
    };
    return { onRequest: onRequest };
};
