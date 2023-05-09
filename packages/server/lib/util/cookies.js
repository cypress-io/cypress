"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieJar = exports.CookieJar = exports.automationCookieToToughCookie = exports.toughCookieToAutomationCookie = exports.Cookie = void 0;
const tough_cookie_1 = require("tough-cookie");
Object.defineProperty(exports, "Cookie", { enumerable: true, get: function () { return tough_cookie_1.Cookie; } });
const toughCookieToAutomationCookie = (toughCookie, defaultDomain) => {
    // tough-cookie is smart enough to determine the expiryTime based on maxAge and expiry
    // meaning the expiry property should be a catch all for determining expiry time
    const expiry = toughCookie.expiryTime();
    return {
        domain: toughCookie.domain || defaultDomain,
        // cast Infinity/-Infinity to a string to make sure the data is serialized through the automation client.
        // cookie normalization in the automation client will cast this back to Infinity/-Infinity
        expiry: (expiry === Infinity || expiry === -Infinity) ? expiry.toString() : expiry / 1000,
        httpOnly: toughCookie.httpOnly,
        // we want to make sure the hostOnly property is respected when syncing with CDP/extension to prevent duplicates
        hostOnly: toughCookie.hostOnly || false,
        maxAge: toughCookie.maxAge,
        name: toughCookie.key,
        path: toughCookie.path,
        sameSite: toughCookie.sameSite === 'none' ? 'no_restriction' : toughCookie.sameSite,
        secure: toughCookie.secure,
        value: toughCookie.value,
    };
};
exports.toughCookieToAutomationCookie = toughCookieToAutomationCookie;
const automationCookieToToughCookie = (automationCookie, defaultDomain) => {
    let expiry = undefined;
    if (automationCookie.expiry != null) {
        if (isFinite(automationCookie.expiry)) {
            expiry = new Date(automationCookie.expiry * 1000);
        }
        else if (automationCookie.expiry === '-Infinity' || automationCookie.expiry === -Infinity) {
            // if negative Infinity, the cookie is Date(0), has expired and is slated to be removed
            expiry = new Date(0);
        }
        // if Infinity is set on the automation client, the expiry doesn't get set, meaning the no-op
        // accomplishes an Infinite expire time
    }
    return new tough_cookie_1.Cookie({
        domain: automationCookie.domain || defaultDomain,
        expires: expiry,
        httpOnly: automationCookie.httpOnly,
        // we want to make sure the hostOnly property is respected when syncing with CDP/extension to prevent duplicates
        hostOnly: automationCookie.hostOnly || false,
        maxAge: automationCookie.maxAge || 'Infinity',
        key: automationCookie.name,
        path: automationCookie.path || undefined,
        sameSite: automationCookie.sameSite === 'no_restriction' ? 'none' : automationCookie.sameSite,
        secure: automationCookie.secure,
        value: automationCookie.value,
    });
};
exports.automationCookieToToughCookie = automationCookieToToughCookie;
const sameSiteNoneRe = /; +samesite=(?:'none'|"none"|none)/i;
/**
 * An adapter for tough-cookie's CookieJar
 * Holds onto cookies captured via the proxy, so they can be applied to
 * requests as needed for the sake of cross-origin testing
 */
class CookieJar {
    constructor() {
        this._cookieJar = new tough_cookie_1.CookieJar(undefined, { allowSpecialUseDomain: true });
    }
    static parse(cookie) {
        const toughCookie = tough_cookie_1.Cookie.parse(cookie);
        if (!toughCookie)
            return;
        // fixes tough-cookie defaulting undefined/invalid SameSite to 'none'
        // https://github.com/salesforce/tough-cookie/issues/191
        const hasUnspecifiedSameSite = toughCookie.sameSite === 'none' && !sameSiteNoneRe.test(cookie);
        // not all browsers currently default to lax, but they're heading in that
        // direction since it's now the standard, so this is more future-proof
        if (hasUnspecifiedSameSite) {
            toughCookie.sameSite = 'lax';
        }
        return toughCookie;
    }
    getCookies(url, sameSiteContext = undefined) {
        // @ts-ignore
        return this._cookieJar.getCookiesSync(url, { sameSiteContext });
    }
    getAllCookies() {
        let cookies = [];
        // have to use the internal memstore. looks like an async api, but
        // it's actually synchronous
        // @ts-ignore
        this._cookieJar.store.getAllCookies((_err, _cookies) => {
            cookies = _cookies;
        });
        return cookies;
    }
    setCookie(cookie, url, sameSiteContext) {
        // @ts-ignore
        return this._cookieJar.setCookieSync(cookie, url, { sameSiteContext });
    }
    removeCookie(cookieData) {
        // have to use the internal memstore. looks like an async api, but
        // it's actually synchronous
        // @ts-ignore
        this._cookieJar.store.removeCookie(cookieData.domain, cookieData.path || '/', cookieData.name, () => { });
    }
    removeAllCookies() {
        this._cookieJar.removeAllCookiesSync();
    }
}
exports.CookieJar = CookieJar;
exports.cookieJar = new CookieJar();
