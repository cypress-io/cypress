"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pumpify = require('pumpify');
var replaceStream = require('./replace_stream').replaceStream;
var utf8Stream = require('utf8-stream');
var topOrParentEqualityBeforeRe = /((?:\bwindow\b|\bself\b)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=]==?\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)(?![\w])/g;
var topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=]==?\s*(?:\bwindow\b|\bself\b))/g;
var topOrParentLocationOrFramesRe = /([^\da-zA-Z\(\)])?(\btop\b|\bparent\b)([.])(\blocation\b|\bframes\b)/g;
var jiraTopWindowGetterRe = /(!function\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*}\(\w{1}\))/g;
var jiraTopWindowGetterUnMinifiedRe = /(function\s*\w{1,}\s*\((\w{1})\)\s*{\s*return\s*\w{1}\s*(?:={2,})\s*\w{1}\.parent)(\s*;\s*})/g;
function strip(html) {
    return html
        .replace(topOrParentEqualityBeforeRe, '$1self')
        .replace(topOrParentEqualityAfterRe, 'self$2')
        .replace(topOrParentLocationOrFramesRe, '$1self$3$4')
        .replace(jiraTopWindowGetterRe, '$1 || $2.parent.__Cypress__$3')
        .replace(jiraTopWindowGetterUnMinifiedRe, '$1 || $2.parent.__Cypress__$3');
}
exports.strip = strip;
function stripStream() {
    return pumpify(utf8Stream(), replaceStream([
        topOrParentEqualityBeforeRe,
        topOrParentEqualityAfterRe,
        topOrParentLocationOrFramesRe,
        jiraTopWindowGetterRe,
        jiraTopWindowGetterUnMinifiedRe,
    ], [
        '$1self',
        'self$2',
        '$1self$3$4',
        '$1 || $2.parent.__Cypress__$3',
        '$1 || $2.parent.__Cypress__$3',
    ]));
}
exports.stripStream = stripStream;
