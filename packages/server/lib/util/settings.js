"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeForTesting = exports.read = exports.isComponentTesting = void 0;
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_1 = require("../util/fs");
const data_context_1 = require("@packages/data-context");
const errors = tslib_1.__importStar(require("../errors"));
const debug = (0, debug_1.default)('cypress:server:settings');
function configCode(obj, isTS) {
    const objJSON = obj && !lodash_1.default.isEmpty(obj)
        ? JSON.stringify(lodash_1.default.omit(obj, 'configFile'), null, 2)
        : `{

}`;
    if (isTS) {
        return `export default ${objJSON}`;
    }
    return `module.exports = ${objJSON}
`;
}
function _err(type, file, err) {
    const e = errors.get(type, file, err);
    e.code = err.code;
    e.errno = err.errno;
    return e;
}
function _logWriteErr(file, err) {
    throw _err('ERROR_WRITING_FILE', file, err);
}
function _write(file, obj = {}) {
    if (/\.json$/.test(file)) {
        debug('writing json file');
        return fs_1.fs.outputJson(file, obj, { spaces: 2 })
            .then(() => obj)
            .catch((err) => {
            return _logWriteErr(file, err);
        });
    }
    debug('writing javascript file');
    const fileExtension = file === null || file === void 0 ? void 0 : file.split('.').pop();
    const isTSFile = fileExtension === 'ts';
    return fs_1.fs.writeFileAsync(file, configCode(obj, isTSFile))
        .return(obj)
        .catch((err) => {
        return _logWriteErr(file, err);
    });
}
function isComponentTesting(options = {}) {
    return options.testingType === 'component';
}
exports.isComponentTesting = isComponentTesting;
async function read(projectRoot) {
    const ctx = (0, data_context_1.getCtx)();
    // For testing purposes, no-op if the projectRoot is already the same
    // as the one set in the DataContext, as it would be in normal execution
    await ctx.lifecycleManager.setCurrentProject(projectRoot);
    return ctx.lifecycleManager.getConfigFileContents();
}
exports.read = read;
function writeForTesting(projectRoot, objToWrite = {}) {
    const file = path_1.default.join(projectRoot, 'cypress.config.js');
    return _write(file, objToWrite);
}
exports.writeForTesting = writeForTesting;
