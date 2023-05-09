"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserEditor = exports.getUserEditor = exports.osFileSystemExplorer = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const env_editors_1 = require("./env-editors");
const shell_1 = tslib_1.__importDefault(require("./shell"));
const savedState = tslib_1.__importStar(require("../saved_state"));
exports.osFileSystemExplorer = {
    darwin: 'Finder',
    win32: 'File Explorer',
    linux: 'File System',
};
const debug = (0, debug_1.default)('cypress:server:util:editors');
const createEditor = (editor) => {
    return {
        id: editor.id,
        name: editor.name,
        binary: editor.binary,
    };
};
const getOtherEditor = (preferredOpener) => {
    // if preferred editor is the 'other' option, use it since it has the
    // path (binary) saved with it
    if (preferredOpener && preferredOpener.id === 'other') {
        return preferredOpener;
    }
    return;
};
const computerOpener = () => {
    return {
        id: 'computer',
        name: exports.osFileSystemExplorer[process.platform] || exports.osFileSystemExplorer.linux,
        binary: 'computer',
    };
};
const getUserEditors = async () => {
    return bluebird_1.default.filter((0, env_editors_1.getEnvEditors)(), (editor) => {
        return shell_1.default.commandExists(editor.binary);
    })
        .then((editors = []) => {
        debug('user has the following editors: %o', editors);
        return savedState.create()
            .then((state) => {
            return state.get().then((state) => state.preferredOpener);
        })
            .then((preferredOpener) => {
            debug('saved preferred editor: %o', preferredOpener);
            const cyEditors = lodash_1.default.map(editors, createEditor);
            const preferred = getOtherEditor(preferredOpener);
            if (!preferred) {
                return [computerOpener()].concat(cyEditors);
            }
            return [computerOpener()].concat(cyEditors, preferred);
        });
    });
};
const getUserEditor = async (alwaysIncludeEditors = false) => {
    debug('get user editor');
    return savedState.create()
        .then((state) => state.get())
        .then((state) => {
        var _a;
        const preferredOpener = (_a = state.preferredOpener) !== null && _a !== void 0 ? _a : undefined;
        if (preferredOpener) {
            debug('return preferred editor: %o', preferredOpener);
            if (!alwaysIncludeEditors) {
                return { preferredOpener, availableEditors: [] };
            }
        }
        return getUserEditors().then((availableEditors) => {
            debug('return available editors: %o', availableEditors);
            return { availableEditors, preferredOpener };
        });
    });
};
exports.getUserEditor = getUserEditor;
const setUserEditor = async (editor) => {
    debug('set user editor: %o', editor);
    const state = await savedState.create();
    state.set({ preferredOpener: editor });
};
exports.setUserEditor = setUserEditor;
