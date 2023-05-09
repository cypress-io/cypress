"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cookies = exports.normalizeGetCookieProps = exports.normalizeGetCookies = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const extension_1 = tslib_1.__importDefault(require("@packages/extension"));
const cdp_automation_1 = require("../browsers/cdp_automation");
// match the w3c webdriver spec on return cookies
// https://w3c.github.io/webdriver/webdriver-spec.html#cookies
const COOKIE_PROPERTIES = 'domain expiry httpOnly hostOnly name path sameSite secure value'.split(' ');
const debug = (0, debug_1.default)('cypress:server:automation:cookies');
const normalizeCookies = (cookies) => {
    return lodash_1.default.map(cookies, normalizeCookieProps);
};
const normalizeCookieProps = function (automationCookie) {
    if (!automationCookie) {
        return automationCookie;
    }
    const cookie = lodash_1.default.pick(automationCookie, COOKIE_PROPERTIES);
    if (automationCookie.expiry === '-Infinity') {
        cookie.expiry = -Infinity;
        // set the cookie to expired so when set, the cookie is removed
        cookie.expirationDate = 0;
    }
    else if (automationCookie.expiry === 'Infinity') {
        cookie.expiry = null;
    }
    else if (automationCookie.expiry != null) {
        // when sending cookie props we need to convert
        // expiry to expirationDate
        delete cookie.expiry;
        cookie.expirationDate = automationCookie.expiry;
    }
    else if (automationCookie.expirationDate != null) {
        // and when receiving cookie props we need to convert
        // expirationDate to expiry and always remove url
        delete cookie.expirationDate;
        delete cookie.url;
        cookie.expiry = automationCookie.expirationDate;
    }
    return cookie;
};
const normalizeGetCookies = (cookies) => {
    return lodash_1.default.chain(cookies)
        .map(exports.normalizeGetCookieProps)
        // sort in order of expiration date, ascending
        .sortBy(lodash_1.default.partialRight(lodash_1.default.get, 'expiry', Number.MAX_SAFE_INTEGER))
        .value();
};
exports.normalizeGetCookies = normalizeGetCookies;
const normalizeGetCookieProps = (props) => {
    if (!props) {
        return props;
    }
    if (props.hostOnly === false || (props.hostOnly && !(0, cdp_automation_1.isHostOnlyCookie)(props))) {
        delete props.hostOnly;
    }
    return normalizeCookieProps(props);
};
exports.normalizeGetCookieProps = normalizeGetCookieProps;
/**
 * Utility for getting/setting/clearing cookies via automation
 * Normalizes the API for different automation mechanisms (CDP, extension, etc)
 */
class Cookies {
    constructor(cyNamespace, cookieNamespace) {
        this.cyNamespace = cyNamespace;
        this.cookieNamespace = cookieNamespace;
        this.isNamespaced = (cookie) => {
            const name = cookie && cookie.name;
            // if the cookie has no name, return false
            if (!name) {
                return false;
            }
            return name.startsWith(this.cyNamespace) || (name === this.cookieNamespace);
        };
        this.throwIfNamespaced = (data) => {
            if (this.isNamespaced(data)) {
                throw new Error('Sorry, you cannot modify a Cypress namespaced cookie.');
            }
        };
    }
    getCookies(data, automate) {
        debug('getting:cookies %o', data);
        return automate('get:cookies', data)
            .then((cookies) => {
            cookies = (0, exports.normalizeGetCookies)(cookies);
            cookies = lodash_1.default.reject(cookies, (cookie) => this.isNamespaced(cookie));
            debug('received get:cookies %o', cookies);
            return cookies;
        });
    }
    getCookie(data, automate) {
        debug('getting:cookie %o', data);
        return automate(data)
            .then((cookie) => {
            if (this.isNamespaced(cookie)) {
                throw new Error('Sorry, you cannot get a Cypress namespaced cookie.');
            }
            else {
                cookie = (0, exports.normalizeGetCookieProps)(cookie);
                debug('received get:cookie %o', cookie);
                return cookie;
            }
        });
    }
    setCookie(data, automate) {
        this.throwIfNamespaced(data);
        const cookie = normalizeCookieProps(data);
        // lets construct the url ourselves right now
        // unless we already have a URL
        cookie.url = data.url != null ? data.url : extension_1.default.getCookieUrl(data);
        debug('set:cookie %o', cookie);
        return automate(cookie)
            .then((cookie) => {
            cookie = (0, exports.normalizeGetCookieProps)(cookie);
            debug('received set:cookie %o', cookie);
            return cookie;
        });
    }
    setCookies(cookies, automate, eventName = 'set:cookies') {
        cookies = cookies.map((data) => {
            this.throwIfNamespaced(data);
            const cookie = normalizeCookieProps(data);
            // lets construct the url ourselves right now
            // unless we already have a URL
            cookie.url = data.url != null ? data.url : extension_1.default.getCookieUrl(data);
            return cookie;
        });
        debug(`${eventName} %o`, cookies);
        return automate(eventName, cookies)
            .return(cookies);
    }
    // set:cookies will clear cookies first in browsers that use CDP. this is the
    // same as set:cookies in Firefox, but will only add cookies and not clear
    // them in Chrome, etc.
    addCookies(cookies, automate) {
        return this.setCookies(cookies, automate, 'add:cookies');
    }
    clearCookie(data, automate) {
        this.throwIfNamespaced(data);
        debug('clear:cookie %o', data);
        return automate(data)
            .then((cookie) => {
            cookie = normalizeCookieProps(cookie);
            debug('received clear:cookie %o', cookie);
            return cookie;
        });
    }
    async clearCookies(data, automate) {
        const cookiesToClear = data;
        const cookies = lodash_1.default.reject(normalizeCookies(cookiesToClear), this.isNamespaced);
        debug('clear:cookies %o', cookies.length);
        return automate('clear:cookies', cookies)
            .mapSeries(normalizeCookieProps);
    }
    changeCookie(data) {
        const c = normalizeCookieProps(data.cookie);
        if (this.isNamespaced(c)) {
            return;
        }
        const msg = data.removed ?
            `Cookie Removed: '${c.name}'`
            :
                `Cookie Set: '${c.name}'`;
        return {
            cookie: c,
            message: msg,
            removed: data.removed,
        };
    }
}
exports.Cookies = Cookies;
Cookies.normalizeCookies = normalizeCookies;
Cookies.normalizeCookieProps = normalizeCookieProps;
