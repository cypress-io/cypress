"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.each = exports.setValue = exports.renameKey = exports.remove = exports.remapKeys = void 0;
const tslib_1 = require("tslib");
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const traverse = (obj, mapObj, parent, key) => {
    if (lodash_1.default.isFunction(mapObj)) {
        mapObj(parent, key, obj);
        return;
    }
    if (lodash_1.default.isObject(mapObj)) {
        lodash_1.default.each(mapObj, (mapVal, mapKey) => {
            traverse(obj[mapKey], mapVal, obj, mapKey);
        });
    }
};
const remapKeys = (fromObj, toObj) => {
    fromObj = lodash_1.default.cloneDeep(fromObj);
    traverse(fromObj, toObj);
    return fromObj;
};
exports.remapKeys = remapKeys;
const remove = (obj, key) => delete obj[key];
exports.remove = remove;
const renameKey = (newName) => {
    return (obj, key, val) => {
        delete obj[key];
        obj[newName] = val;
    };
};
exports.renameKey = renameKey;
const setValue = (defaultVal) => {
    return (obj, key) => {
        obj[key] = defaultVal;
    };
};
exports.setValue = setValue;
const each = (fn) => {
    return (__, ___, arr) => {
        return lodash_1.default.each(arr, (val, i) => {
            const mapObj = lodash_1.default.isFunction(fn) ? fn(val, i) : fn;
            traverse(val, mapObj);
        });
    };
};
exports.each = each;
