"use strict";
// useful links for describing the parts that make up a URL:
// - https://nodejs.org/api/url.html#url_url_strings_and_url_objects
// - https://en.wikipedia.org/wiki/Uniform_Resource_Identifier#Examples
//
// node's url formatting algorithm (which acts pretty unexpectedly)
// - https://nodejs.org/api/url.html#url_url_format_urlobject
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var url_1 = __importDefault(require("url"));
// yup, protocol contains a: ':' colon
// at the end of it (-______________-)
var DEFAULT_PROTOCOL_PORTS = {
    'https:': '443',
    'http:': '80',
};
var DEFAULT_PORTS = lodash_1.default.values(DEFAULT_PROTOCOL_PORTS);
var portIsDefault = function (port) {
    return port && DEFAULT_PORTS.includes(port);
};
var parseClone = function (urlObject) {
    return url_1.default.parse(lodash_1.default.clone(urlObject));
};
exports.parse = url_1.default.parse;
function stripProtocolAndDefaultPorts(urlToCheck) {
    // grab host which is 'hostname:port' only
    var _a = url_1.default.parse(urlToCheck), host = _a.host, hostname = _a.hostname, port = _a.port;
    // if we have a default port for 80 or 443
    // then just return the hostname
    if (portIsDefault(port)) {
        return hostname;
    }
    // else return the host
    return host;
}
exports.stripProtocolAndDefaultPorts = stripProtocolAndDefaultPorts;
function removePort(urlObject) {
    var parsed = parseClone(urlObject);
    // set host to undefined else url.format(...) will ignore the port property
    // https://nodejs.org/api/url.html#url_url_format_urlobject
    delete parsed.host;
    delete parsed.port;
    return parsed;
}
exports.removePort = removePort;
function removeDefaultPort(urlToCheck) {
    var parsed = parseClone(urlToCheck);
    if (portIsDefault(parsed.port)) {
        parsed = removePort(parsed);
    }
    return parsed;
}
exports.removeDefaultPort = removeDefaultPort;
function addDefaultPort(urlToCheck) {
    var parsed = parseClone(urlToCheck);
    if (!parsed.port) {
        // unset host...
        // see above for reasoning
        delete parsed.host;
        if (parsed.protocol) {
            parsed.port = DEFAULT_PROTOCOL_PORTS[parsed.protocol];
        }
        else {
            delete parsed.port;
        }
    }
    return parsed;
}
exports.addDefaultPort = addDefaultPort;
function getPath(urlToCheck) {
    return url_1.default.parse(urlToCheck).path;
}
exports.getPath = getPath;
