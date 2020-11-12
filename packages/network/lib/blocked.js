"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var minimatch_1 = __importDefault(require("minimatch"));
var uri_1 = require("./uri");
function matches(urlToCheck, blockHosts) {
    // normalize into flat array
    blockHosts = [].concat(blockHosts);
    urlToCheck = uri_1.stripProtocolAndDefaultPorts(urlToCheck);
    // use minimatch against the url
    // to see if any match
    var matchUrl = function (hostMatcher) {
        return minimatch_1.default(urlToCheck, hostMatcher);
    };
    return lodash_1.default.find(blockHosts, matchUrl);
}
exports.matches = matches;
