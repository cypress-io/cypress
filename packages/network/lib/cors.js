"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var uri = __importStar(require("./uri"));
var debug_1 = __importDefault(require("debug"));
var parse_domain_1 = __importDefault(require("@cypress/parse-domain"));
var debug = debug_1.default('cypress:network:cors');
// match IP addresses or anything following the last .
var customTldsRe = /(^[\d\.]+$|\.[^\.]+$)/;
function getSuperDomain(url) {
    var parsed = parseUrlIntoDomainTldPort(url);
    return lodash_1.default.compact([parsed.domain, parsed.tld]).join('.');
}
exports.getSuperDomain = getSuperDomain;
function parseDomain(domain, options) {
    if (options === void 0) { options = {}; }
    return parse_domain_1.default(domain, lodash_1.default.defaults(options, {
        privateTlds: true,
        customTlds: customTldsRe,
    }));
}
exports.parseDomain = parseDomain;
function parseUrlIntoDomainTldPort(str) {
    var _a = uri.parse(str), hostname = _a.hostname, port = _a.port, protocol = _a.protocol;
    if (!hostname) {
        hostname = '';
    }
    if (!port) {
        port = protocol === 'https:' ? '443' : '80';
    }
    var parsed = parseDomain(hostname);
    // if we couldn't get a parsed domain
    if (!parsed) {
        // then just fall back to a dumb check
        // based on assumptions that the tld
        // is the last segment after the final
        // '.' and that the domain is the segment
        // before that
        var segments = hostname.split('.');
        parsed = {
            tld: segments[segments.length - 1] || '',
            domain: segments[segments.length - 2] || '',
        };
    }
    var obj = {};
    obj.port = port;
    obj.tld = parsed.tld;
    obj.domain = parsed.domain;
    debug('Parsed URL %o', obj);
    return obj;
}
exports.parseUrlIntoDomainTldPort = parseUrlIntoDomainTldPort;
function urlMatchesOriginPolicyProps(urlStr, props) {
    // take a shortcut here in the case
    // where remoteHostAndPort is null
    if (!props) {
        return false;
    }
    var parsedUrl = parseUrlIntoDomainTldPort(urlStr);
    // does the parsedUrl match the parsedHost?
    return lodash_1.default.isEqual(parsedUrl, props);
}
exports.urlMatchesOriginPolicyProps = urlMatchesOriginPolicyProps;
function urlMatchesOriginProtectionSpace(urlStr, origin) {
    var normalizedUrl = uri.addDefaultPort(urlStr).format();
    var normalizedOrigin = uri.addDefaultPort(origin).format();
    return lodash_1.default.startsWith(normalizedUrl, normalizedOrigin);
}
exports.urlMatchesOriginProtectionSpace = urlMatchesOriginProtectionSpace;
