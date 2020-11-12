"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var _ = __importStar(require("lodash"));
exports.SERIALIZABLE_REQ_PROPS = [
    'headers',
    'body',
    'url',
    'method',
    'httpVersion',
    'responseTimeout',
    'followRedirect',
];
exports.SERIALIZABLE_RES_PROPS = _.concat(exports.SERIALIZABLE_REQ_PROPS, 'statusCode', 'statusMessage');
exports.DICT_STRING_MATCHER_FIELDS = ['headers', 'query'];
exports.STRING_MATCHER_FIELDS = ['auth.username', 'auth.password', 'hostname', 'method', 'path', 'pathname', 'url'];
