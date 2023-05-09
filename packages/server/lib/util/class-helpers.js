"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureProp = void 0;
const propertyGetterNameRe = /\.get\s(.+?)\s/;
class AnyClass {
}
function ensureProp(prop, methodSetter) {
    if (!prop) {
        const obj = {};
        Error.captureStackTrace(obj, ensureProp);
        const propertyGetterStackLine = obj.stack.split('\n')[1];
        const matched = propertyGetterStackLine.match(propertyGetterNameRe);
        const propName = matched && matched[1];
        throw new Error(`${this.constructor.name}#${methodSetter} must first be called before accessing 'this.${propName}'`);
    }
    return prop;
}
exports.ensureProp = ensureProp;
