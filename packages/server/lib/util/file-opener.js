"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openFile = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const launch_editor_1 = tslib_1.__importDefault(require("launch-editor"));
const debug = (0, debug_1.default)('cypress:server:file-opener');
const openFile = (fileDetails) => {
    debug('open file: %o', fileDetails);
    const binary = fileDetails.where.binary;
    if (binary === 'computer') {
        try {
            require('electron').shell.showItemInFolder(fileDetails.file);
        }
        catch (err) {
            debug('error opening file: %s', err.stack);
        }
        return;
    }
    const { file, line, column } = fileDetails;
    (0, launch_editor_1.default)(`${file}:${line}:${column}`, `"${binary}"`, (__, errMsg) => {
        debug('error opening file: %s', errMsg);
    });
};
exports.openFile = openFile;
