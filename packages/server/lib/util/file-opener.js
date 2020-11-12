"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var launch_editor_1 = __importDefault(require("launch-editor"));
var debug = debug_1.default('cypress:server:file-opener');
exports.openFile = function (fileDetails) {
    debug('open file: %o', fileDetails);
    var openerId = fileDetails.where.openerId;
    if (openerId === 'computer') {
        try {
            require('electron').shell.showItemInFolder(fileDetails.file);
        }
        catch (err) {
            debug('error opening file: %s', err.stack);
        }
        return;
    }
    var file = fileDetails.file, line = fileDetails.line, column = fileDetails.column;
    launch_editor_1.default(file + ":" + line + ":" + column, "\"" + openerId + "\"", function (__, errMsg) {
        debug('error opening file: %s', errMsg);
    });
};
