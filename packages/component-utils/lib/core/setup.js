"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("./errors");
var dom_1 = require("./util/dom");
var styles_1 = require("./util/styles");
function checkMountModeEnabled() {
    if (Cypress.spec.specType !== 'component') {
        throw new Error("In order to use mount or unmount functions please place the spec in component folder");
    }
}
var injectGlobalStyles = function (options, _document) {
    if (_document === void 0) { _document = dom_1.getDocument(); }
    var el = dom_1.getRoot(options.rootId, _document);
    if (el === null)
        return errors_1.handleError(); // short circuit to avoid null checks
    return styles_1.injectStylesBeforeElement(options, _document, el);
};
function setup(componentTestInstance) {
    var options = componentTestInstance.options;
    if (options.mountModeEnabled)
        checkMountModeEnabled();
    return cy
        .then(function () { return injectGlobalStyles(options); })
        .then(function () { return componentTestInstance; });
}
exports.setup = setup;
