"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var traverse = function (obj, mapObj, parent, key) {
    if (lodash_1.default.isFunction(mapObj)) {
        mapObj(parent, key, obj);
        return;
    }
    if (lodash_1.default.isObject(mapObj)) {
        lodash_1.default.each(mapObj, function (mapVal, mapKey) {
            traverse(obj[mapKey], mapVal, obj, mapKey);
        });
    }
};
exports.remapKeys = function (fromObj, toObj) {
    fromObj = lodash_1.default.cloneDeep(fromObj);
    traverse(fromObj, toObj);
    return fromObj;
};
exports.remove = function (obj, key) { return delete obj[key]; };
exports.renameKey = function (newName) {
    return function (obj, key, val) {
        delete obj[key];
        obj[newName] = val;
    };
};
exports.setValue = function (defaultVal) {
    return function (obj, key) {
        obj[key] = defaultVal;
    };
};
exports.each = function (fn) {
    return function (__, ___, arr) {
        return lodash_1.default.each(arr, function (val, i) {
            var mapObj = lodash_1.default.isFunction(fn) ? fn(val, i) : fn;
            traverse(val, mapObj);
        });
    };
};
