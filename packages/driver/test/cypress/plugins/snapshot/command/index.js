"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
// @ts-ignore
var _ = require('lodash');
// @ts-ignore
var debug_1 = require("debug");
var chalk_1 = require("chalk");
var stripAnsi = require("strip-ansi");
var common_tags_1 = require("common-tags");
var sinon_1 = require("sinon");
var debug = debug_1["default"]('plugin:snapshot');
// window.localStorage.debug = 'spec* plugin:snapshot'
// Debug.enable('plugin:snapshot')
var registerInCypress = function () {
    //@ts-ignore
    _ = Cypress._;
    //@ts-ignore
    sinon_1["default"] = Cypress.sinon;
    var $ = Cypress.$;
    var snapshotIndex = {};
    var matchDeepCypress = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        matchDeep.apply(this, args.concat([{ Cypress: Cypress }]));
    };
    var matchSnapshotCypress = function (m, snapshotName) {
        var ctx = this;
        var testName = Cypress.mocha.getRunner().test.fullTitle();
        var file = Cypress.spec.name;
        snapshotIndex[testName] = (snapshotIndex[testName] || 0) + 1;
        var exactSpecName = snapshotName || testName + " #" + snapshotIndex[testName];
        cy.task('getSnapshot', {
            file: file,
            exactSpecName: exactSpecName
        }, { log: false }).then(function (exp) {
            try {
                var res_1 = matchDeep.call(ctx, m, exp, { message: 'to match snapshot', Cypress: Cypress, isSnapshot: true, sinon: sinon_1["default"] });
                Cypress.log({
                    name: 'assert',
                    message: "snapshot matched: **" + exactSpecName + "**",
                    state: 'passed',
                    consoleProps: function () {
                        return {
                            Actual: res_1.act
                        };
                    }
                });
            }
            catch (e) {
                if (Cypress.env('SNAPSHOT_UPDATE') && e.act) {
                    Cypress.log({
                        name: 'assert',
                        message: "snapshot updated: **" + exactSpecName + "**",
                        state: 'passed',
                        consoleProps: function () {
                            return {
                                Expected: exp,
                                Actual: e.act
                            };
                        }
                    });
                    return e.act;
                }
                Cypress.log({
                    name: 'assert',
                    message: "**snapshot failed match**: " + e.message,
                    state: 'failed',
                    consoleProps: function () {
                        return {
                            Expected: exp,
                            Actual: e.act
                        };
                    }
                });
                throw e;
            }
        })
            .then(function (act) {
            cy.task('saveSnapshot', {
                file: file,
                what: act,
                exactSpecName: exactSpecName
            }, { log: false });
        });
    };
    chai.Assertion.addMethod('matchDeep', matchDeepCypress);
    chai.Assertion.addMethod('matchSnapshot', matchSnapshotCypress);
    after(function () {
        snapshotIndex = {};
    });
    before(function () {
        var btn = addButton('toggle-snapshot-update', 'fa-camera', function () {
            var prev = Cypress.env('SNAPSHOT_UPDATE');
            Cypress.env('SNAPSHOT_UPDATE', !prev);
            updateText();
        });
        var btnIcon = btn.children().first();
        var updateText = function () {
            return btnIcon.text(Cypress.env('SNAPSHOT_UPDATE') ? 'snapshot\nupdate\non' : 'snapshot\nupdate\noff')
                .css({ 'font-size': '10px', 'line-height': '0.9' })
                .html(btnIcon.html().replace(/\n/g, '<br/>'));
        };
        updateText();
    });
    var addButton = function (name, faClass, fn) {
        $("#" + name, window.top.document).remove();
        var btn = $("<span id=\"" + name + "\"><button><i class=\"fa " + faClass + "\"></i></button></span>", window.top.document);
        var container = $('.toggle-auto-scrolling.auto-scrolling-enabled', window.top.document).closest('.controls');
        container.prepend(btn);
        btn.on('click', fn);
        return btn;
    };
};
exports.registerInCypress = registerInCypress;
// // unfortunate, but sinon uses isPrototype of, which will not work for
// // two different sinon versions
// match.isMatcher = (obj) => {
//   return _.isFunction(_.get(obj, 'test')) &&
//   _.isString(_.get(obj, 'message')) &&
//   _.isFunction(_.get(obj, 'and')) &&
//   _.isFunction(_.get(obj, 'or'))
// }
var matcherStringToObj = function (mes) {
    var res = mes.replace(/typeOf\("(\w+)"\)/, '$1');
    var ret = {};
    ret.toString = function () {
        return "" + res;
    };
    ret.toJSON = function () {
        return "match." + res;
    };
    return ret;
};
var matchDeep = function (matchers, exp, optsArg) {
    var m = matchers;
    if (exp === undefined) {
        exp = m;
        m = {};
    }
    // debug(optsArg)
    var opts = _.defaults(optsArg, {
        message: 'to match',
        Cypress: false,
        diff: true,
        onlyExpected: false,
        sinon: null
    });
    if (!opts.sinon) {
        opts.sinon = sinon_1["default"];
    }
    var match = opts.sinon.match;
    var isAnsi = !opts.Cypress;
    // const isSnapshot = opts.isSnapshot
    var act = this._obj;
    // let act = this._obj
    // console.log(act)
    m = _.map(m, function (val, key) {
        return [key.split('.'), val];
    });
    var diffStr = withMatchers(m, match, opts.onlyExpected)(exp, act);
    // console.log(diffStr.act)
    if (diffStr.changed) {
        var e = _.extend(new Error(), { act: diffStr.act });
        // e.act[1][1].somefoo = undefined
        e.message = isAnsi ? "\n" + diffStr.text : stripAnsi(diffStr.text);
        throw e;
    }
    return diffStr;
};
exports.matchDeep = matchDeep;
var typeColors = {
    modified: chalk_1["default"].yellow,
    added: chalk_1["default"].green,
    removed: chalk_1["default"].red,
    normal: chalk_1["default"].gray,
    failed: chalk_1["default"].redBright
};
var options = {
    indent: 2,
    indentChar: ' ',
    newLineChar: '\n',
    wrap: function wrap(type, text) {
        return typeColors[type](text);
    }
};
var indent = '';
for (var i = 0; i < options.indent; i++) {
    indent += options.indentChar;
}
function isObject(obj) {
    return typeof obj === 'object' && obj && getType(obj) !== 'RegExp';
    // return typeof obj === 'object' && obj && !Array.isArray(obj)
}
function printVar(variable) {
    switch (getType(variable)) {
        case 'Null':
            return variable;
        case 'Undefined':
            return variable;
        case 'Boolean':
            return variable;
        case 'Number':
            return variable;
        case 'Function':
            return "[Function" + (variable.name ? " " + variable.name : '') + "]";
        // return variable.toString().replace(/\{.+\}/, '{}')
        case 'Array':
        case 'Object':
            if (variable.toJSON) {
                return variable.toJSON();
            }
            return stringifyShort(variable);
            return "[" + getType(variable) + "]";
        case 'String':
            if (!variable) {
                return JSON.stringify(variable);
            }
            return "" + variable;
        // return JSON.stringify(variable)
        default: return "" + variable;
    }
}
function indentSubItem(text) {
    return text.split(options.newLineChar).map(function onMap(line, index) {
        if (index === 0) {
            return line;
        }
        return indent + line;
    }).join(options.newLineChar);
}
function getType(obj) {
    return Object.prototype.toString.call(obj).split('[object ').join('').slice(0, -1);
}
function keyChanged(key, text) {
    return indent + key + ": " + indentSubItem(text) + options.newLineChar;
}
function keyRemoved(key, variable) {
    return options.wrap('removed', "- " + key + ": " + printVar(variable)) + options.newLineChar;
}
function keyAdded(key, variable) {
    return options.wrap('added', "+ " + key + ": " + printVar(variable)) + options.newLineChar;
}
function parseMatcher(obj, match) {
    if (match.isMatcher(obj)) {
        return obj;
    }
    var parseObj = (_.isString(obj) && obj) || (obj && obj.toJSON && obj.toJSON());
    if (parseObj) {
        var parsed = /match\.(.*)/.exec(parseObj);
        if (parsed) {
            // debug('parsed matcher from string:', parsed[1])
            return match[parsed[1]];
        }
        return obj;
    }
    return obj;
}
function setReplacement(act, val, path) {
    if (_.isFunction(val)) {
        return val(act, path);
    }
    return val;
}
var withMatchers = function (matchers, match, onlyExpected) {
    var getReplacementFor = function (path, m) {
        if (path === void 0) { path = []; }
        var _loop_1 = function (rep) {
            var wildCards = _.keys(_.pickBy(rep[0], function (value) {
                return value === '*';
            }));
            var _path = _.map(path, function (value, key) {
                if (_.includes(wildCards, "" + key)) {
                    return '*';
                }
                return value;
            });
            var matched = _path.join('.').endsWith(rep[0].join('.'));
            // (_.last(_path) === _.last(val[0]))
            //    && _.isEqual(_.intersection(_path, val[0]), val[0])
            if (matched) {
                return { value: rep[1] };
            }
        };
        for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
            var rep = m_1[_i];
            var state_1 = _loop_1(rep);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    };
    var testValue = function (matcher, value) {
        // if (match.isMatcher(value)) {
        //   if (value.toString() === matcher.toString()) {
        //     return true
        //   }
        // }
        if (matcher.test(value)) {
            return true;
        }
        // addErr(new Error(`replace matcher failed: ${genError(newPath, matcher.toString(), value)}`))
        return false;
    };
    var diff = function (exp, act, path, optsArg) {
        if (path === void 0) { path = ['^']; }
        var opts = _.defaults(optsArg, {
            onlyExpected: onlyExpected
        });
        if (path.length > 15) {
            throw new Error("exceeded max depth on " + path.slice(-8));
        }
        // console.log(act)
        var text = '';
        var changed = false;
        var itemDiff;
        var keys;
        var subOutput = '';
        var replacement = getReplacementFor(path, matchers);
        // console.log(path)
        if (replacement) {
            if (match.isMatcher(replacement)) {
                if (testValue(replacement, act)) {
                    act = matcherStringToObj(replacement.message).toJSON();
                }
                else {
                    // changed = true
                    if (!_.isFunction(act)) {
                        act = _.clone(act);
                    }
                    exp = matcherStringToObj(replacement.message).toJSON();
                }
            }
            else {
                act = setReplacement(act, replacement, path);
            }
        }
        else {
            if (!_.isFunction(act) && !_.isFunction(_.get(act, 'toJSON'))) {
                act = _.clone(act);
            }
            exp = parseMatcher(exp, match);
            if (match.isMatcher(exp)) {
                if (testValue(exp, act)) {
                    act = matcherStringToObj(exp.message).toJSON();
                    return {
                        text: '',
                        changed: false,
                        act: act
                    };
                }
                else {
                    return {
                        text: options.wrap('failed', chalk_1["default"].green(printVar(act)) + " \u26D4  " + matcherStringToObj(exp.message).toJSON()),
                        changed: true,
                        act: act
                    };
                    // changed = true
                    exp = matcherStringToObj(exp.message).toJSON();
                }
            }
        }
        if (_.isFunction(_.get(act, 'toJSON'))) {
            act = act.toJSON();
        }
        if (false && Array.isArray(exp) && Array.isArray(act)) {
            act = act.slice();
            var i = 0;
            for (i = 0; i < exp.length; i++) {
                if (i < act.length) {
                    debug(common_tags_1.stripIndent(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          recurse:\n            exp[", ".", "]: ", "\n            act[", ".", "]: ", "\n          "], ["\n          recurse:\n            exp[", ".", "]: ", "\n            act[", ".", "]: ", "\n          "])), path.join('.'), i, stringifyShort(exp[i]), path.join('.'), i, stringifyShort(act[i])));
                    itemDiff = diff(exp[i], act[i], path.concat([i]));
                    act[i] = itemDiff.act;
                    if (itemDiff.changed) {
                        console.log('changed....', itemDiff.text);
                        subOutput += keyChanged(i, itemDiff.text);
                        console.log(subOutput);
                        changed = true;
                    }
                }
                else {
                    subOutput += keyRemoved(i, exp[i]);
                    changed = true;
                }
            }
            if (act.length > exp.length && !onlyExpected) {
                for (; i < act.length; i++) {
                    var val = act[i];
                    var addDiff = diff(val, val, path.concat([i]));
                    act[i] = addDiff.act;
                    // subOutput += keyAdded(key, act[key])
                    subOutput += keyAdded(i, act[i]);
                }
                changed = true;
            }
            if (changed) {
                text = "[" + options.newLineChar + subOutput + "]";
            }
        }
        else if (isObject(exp) && isObject(act) && !match.isMatcher(exp)) {
            keys = _.keysIn(exp);
            var actObj = __assign({}, act);
            var key = void 0;
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
                key = keys[i];
                if (_.hasIn(act, key)) {
                    itemDiff = diff(exp[key], act[key], path.concat([key]));
                    act[key] = itemDiff.act;
                    if (itemDiff.changed) {
                        subOutput += keyChanged(key, itemDiff.text);
                        changed = true;
                    }
                }
                else {
                    subOutput += keyRemoved(key, exp[key]);
                    changed = true;
                }
                delete actObj[key];
            }
            var addedKeys = _.keysIn(actObj);
            if (!opts.onlyExpected) {
                for (var i = 0; i < addedKeys.length; i++) {
                    var key_1 = addedKeys[i];
                    var val = act[key_1];
                    if (val === undefined)
                        continue;
                    var addDiff = diff(val, val, path.concat([key_1]));
                    act[key_1] = addDiff.act;
                    subOutput += keyAdded(key_1, act[key_1]);
                    changed = true;
                }
            }
            if (changed) {
                var renderBracket = false;
                if (_.isArray(act) && _.isArray(exp)) {
                    renderBracket = true;
                }
                var _O = renderBracket ? '[' : '{';
                var _C = renderBracket ? ']' : '}';
                text = options.wrap('normal', "" + _O + options.newLineChar + subOutput + _C);
            }
            // }
            // else if (Array.isArray(act)) {
            //   return diff([], act, path)
        }
        else if (match.isMatcher(exp)) {
            debug('is matcher');
            if (!testValue(exp, act)) {
                text = options.wrap('failed', chalk_1["default"].green(printVar(act)) + " \u26D4  " + matcherStringToObj(exp.message).toJSON());
                changed = true;
            }
        }
        else if (isObject(act)) {
            debug('only act is obj');
            var addDiff = diff({}, act, path, { onlyExpected: false });
            return __assign({}, addDiff, { changed: true, text: options.wrap('removed', printVar(exp) + "\n" + options.wrap('added', addDiff.text)) });
            // return {
            //   changed: true,
            //   text: options.wrap('modified', `${exp} => ${act}`),
            //   act: addDiff.act
            // }
        }
        else {
            debug('neither is obj');
            exp = printVar(exp);
            act = printVar(act);
            if (exp !== act) {
                text = options.wrap('modified', exp + " \u27A1\uFE0F " + act);
                changed = true;
            }
        }
        return {
            changed: changed,
            text: text,
            act: act
        };
    };
    return diff;
};
// module.exports = diff
var stringifyShort = function (obj) {
    var constructorName = _.get(obj, 'constructor.name');
    if (constructorName && !_.includes(['Object', 'Array'], constructorName)) {
        return "{" + constructorName + "}";
    }
    if (_.isArray(obj)) {
        return "[Array " + obj.length + "]";
    }
    if (_.isObject(obj)) {
        return "{Object " + Object.keys(obj).length + "}";
    }
    return obj;
};
var templateObject_1;
