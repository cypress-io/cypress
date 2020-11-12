"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var bluebird_1 = __importDefault(require("bluebird"));
var debug_1 = __importDefault(require("debug"));
var env_editors_1 = require("./env-editors");
var shell_1 = __importDefault(require("./shell"));
var saved_state_1 = __importDefault(require("../saved_state"));
var debug = debug_1.default('cypress:server:editors');
var createEditor = function (editor) {
    return {
        id: editor.id,
        name: editor.name,
        openerId: editor.binary,
        isOther: false,
    };
};
var getOtherEditor = function (preferredOpener) {
    // if preferred editor is the 'other' option, use it since it has the
    // path (openerId) saved with it
    if (preferredOpener && preferredOpener.isOther) {
        return preferredOpener;
    }
    return {
        id: 'other',
        name: 'Other',
        openerId: '',
        isOther: true,
    };
};
var computerOpener = function () {
    var names = {
        darwin: 'Finder',
        win32: 'File Explorer',
        linux: 'File System',
    };
    return {
        id: 'computer',
        name: names[process.platform] || names.linux,
        openerId: 'computer',
        isOther: false,
    };
};
var getUserEditors = function () {
    return bluebird_1.default.filter(env_editors_1.getEnvEditors(), function (editor) {
        debug('check if user has editor %s with binary %s', editor.name, editor.binary);
        return shell_1.default.commandExists(editor.binary);
    })
        .then(function (editors) {
        if (editors === void 0) { editors = []; }
        debug('user has the following editors: %o', editors);
        return saved_state_1.default.create()
            .then(function (state) {
            return state.get('preferredOpener');
        })
            .then(function (preferredOpener) {
            debug('saved preferred editor: %o', preferredOpener);
            var cyEditors = lodash_1.default.map(editors, createEditor);
            // @ts-ignore
            return [computerOpener()].concat(cyEditors).concat([getOtherEditor(preferredOpener)]);
        });
    });
};
exports.getUserEditor = function (alwaysIncludeEditors) {
    if (alwaysIncludeEditors === void 0) { alwaysIncludeEditors = false; }
    debug('get user editor');
    return saved_state_1.default.create()
        .then(function (state) { return state.get(); })
        .then(function (state) {
        var preferredOpener = state.preferredOpener;
        if (preferredOpener) {
            debug('return preferred editor: %o', preferredOpener);
            if (!alwaysIncludeEditors) {
                return { preferredOpener: preferredOpener };
            }
        }
        return getUserEditors().then(function (availableEditors) {
            debug('return available editors: %o', availableEditors);
            return { availableEditors: availableEditors, preferredOpener: preferredOpener };
        });
    });
};
exports.setUserEditor = function (editor) {
    debug('set user editor: %o', editor);
    return saved_state_1.default.create()
        .then(function (state) {
        state.set('preferredOpener', editor);
    });
};
