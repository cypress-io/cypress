"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cookieMatches = void 0;
const tough_cookie_1 = require("tough-cookie");
const cookieMatches = (cookie, filter) => {
    if (filter.domain && !(0, tough_cookie_1.domainMatch)(filter.domain, cookie.domain)) {
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
exports.cookieMatches = cookieMatches;
