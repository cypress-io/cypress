"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var options_1 = require("../options");
var rootId = options_1.DefaultMountOptions.rootId;
function getRoot(id, _document) {
    if (id === void 0) { id = rootId; }
    if (_document === void 0) { _document = getDocument(); }
    return _document.getElementById(id);
}
exports.getRoot = getRoot;
function getDocument() {
    return cy.get('document');
}
exports.getDocument = getDocument;
function renderTarget(_document) {
    if (_document === void 0) { _document = getDocument(); }
    var rootNode = _document.createElement('div');
    rootNode.setAttribute('id', rootId);
    _document.getElementsByTagName('body')[0].prepend(rootNode);
    return cy.get("#" + rootId, { log: false });
}
exports.renderTarget = renderTarget;
function renderTargetIfNotExists() {
    return getRoot() || renderTarget();
}
exports.renderTargetIfNotExists = renderTargetIfNotExists;
