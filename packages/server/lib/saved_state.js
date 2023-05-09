"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.formStatePath = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const path_1 = tslib_1.__importDefault(require("path"));
const debug_1 = tslib_1.__importDefault(require("debug"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const app_data_1 = tslib_1.__importDefault(require("./util/app_data"));
const cwd_1 = tslib_1.__importDefault(require("./cwd"));
const file_1 = tslib_1.__importDefault(require("./util/file"));
const fs_1 = require("./util/fs");
const types_1 = require("@packages/types");
const data_context_1 = require("@packages/data-context");
const debug = (0, debug_1.default)('cypress:server:saved_state');
const stateFiles = {};
const formStatePath = (projectRoot) => {
    return bluebird_1.default.try(() => {
        debug('making saved state from %s', (0, cwd_1.default)());
        if (projectRoot) {
            debug('for project path %s', projectRoot);
            return projectRoot;
        }
        debug('missing project path, looking for project here');
        let cypressConfigPath = (0, cwd_1.default)('cypress.config.js');
        return fs_1.fs.pathExistsAsync(cypressConfigPath)
            .then((found) => {
            if (found) {
                debug('found cypress file %s', cypressConfigPath);
                projectRoot = (0, cwd_1.default)();
                return;
            }
            cypressConfigPath = (0, cwd_1.default)('cypress.config.ts');
            return fs_1.fs.pathExistsAsync(cypressConfigPath);
        })
            .then((found) => {
            if (found) {
                debug('found cypress file %s', cypressConfigPath);
                projectRoot = (0, cwd_1.default)();
            }
            return projectRoot;
        });
    }).then((projectRoot) => {
        const fileName = 'state.json';
        if (projectRoot) {
            debug(`state path for project ${projectRoot}`);
            return path_1.default.join(app_data_1.default.toHashName(projectRoot), fileName);
        }
        debug('state path for global mode');
        return path_1.default.join('__global__', fileName);
    });
};
exports.formStatePath = formStatePath;
const normalizeAndAllowSet = (set, key, value) => {
    const valueObject = (() => {
        if (lodash_1.default.isString(key)) {
            const tmp = {};
            tmp[key] = value;
            return tmp;
        }
        return key;
    })();
    const invalidKeys = lodash_1.default.filter(lodash_1.default.keys(valueObject), (key) => {
        return !lodash_1.default.includes(types_1.allowedKeys, key);
    });
    if (invalidKeys.length) {
        // eslint-disable-next-line no-console
        console.error(`WARNING: attempted to save state for non-allowed key(s): ${invalidKeys.join(', ')}. All keys must be allowed in server/lib/saved_state.ts`);
    }
    return set(lodash_1.default.pick(valueObject, types_1.allowedKeys));
};
const create = (projectRoot, isTextTerminal = false) => {
    if (isTextTerminal) {
        debug('noop saved state');
        return bluebird_1.default.resolve(file_1.default.noopFile);
    }
    return (0, exports.formStatePath)(projectRoot)
        .then((statePath) => {
        const fullStatePath = app_data_1.default.projectsPath(statePath);
        debug('full state path %s', fullStatePath);
        if (stateFiles[fullStatePath]) {
            return stateFiles[fullStatePath];
        }
        debug('making new state file around %s', fullStatePath);
        const stateFile = new file_1.default({
            path: fullStatePath,
        });
        data_context_1.globalPubSub.on('test:cleanup', () => {
            stateFile.__resetForTest();
        });
        stateFile.set = lodash_1.default.wrap(stateFile.set.bind(stateFile), normalizeAndAllowSet);
        stateFiles[fullStatePath] = stateFile;
        return stateFile;
    });
};
exports.create = create;
