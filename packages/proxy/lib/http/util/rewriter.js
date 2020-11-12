"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var inject = __importStar(require("./inject"));
var astRewriter = __importStar(require("./ast-rewriter"));
var regexRewriter = __importStar(require("./regex-rewriter"));
var doctypeRe = /(<\!doctype.*?>)/i;
var headRe = /(<head(?!er).*?>)/i;
var bodyRe = /(<body.*?>)/i;
var htmlRe = /(<html.*?>)/i;
function getRewriter(useAstSourceRewriting) {
    return useAstSourceRewriting ? astRewriter : regexRewriter;
}
function getHtmlToInject(_a) {
    var domainName = _a.domainName, wantsInjection = _a.wantsInjection;
    switch (wantsInjection) {
        case 'full':
            return inject.full(domainName);
        case 'partial':
            return inject.partial(domainName);
        default:
            return;
    }
}
function html(html, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var replace, htmlToInject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    replace = function (re, str) {
                        return html.replace(re, str);
                    };
                    htmlToInject = getHtmlToInject(opts);
                    if (!opts.wantsSecurityRemoved) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve(getRewriter(opts.useAstSourceRewriting).strip(html, opts))];
                case 1:
                    html = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!htmlToInject) {
                        return [2 /*return*/, html];
                    }
                    // TODO: move this into regex-rewriting and have ast-rewriting handle this in its own way
                    switch (false) {
                        case !headRe.test(html):
                            return [2 /*return*/, replace(headRe, "$1 " + htmlToInject)];
                        case !bodyRe.test(html):
                            return [2 /*return*/, replace(bodyRe, "<head> " + htmlToInject + " </head> $1")];
                        case !htmlRe.test(html):
                            return [2 /*return*/, replace(htmlRe, "$1 <head> " + htmlToInject + " </head>")];
                        case !doctypeRe.test(html):
                            // if only <!DOCTYPE> content, inject <head> after doctype
                            return [2 /*return*/, html + "<head> " + htmlToInject + " </head>"];
                        default:
                            return [2 /*return*/, "<head> " + htmlToInject + " </head>" + html];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.html = html;
function security(opts) {
    return getRewriter(opts.useAstSourceRewriting).stripStream(opts);
}
exports.security = security;
