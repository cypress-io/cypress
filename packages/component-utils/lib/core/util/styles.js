"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("./dom");
/**
 * Insert links to external style resources.
 */
function insertStylesheets(stylesheets, _document, el) {
    stylesheets.forEach(function (href) {
        var link = _document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = href;
        _document.body.insertBefore(link, el);
    });
}
/**
 * Inserts a single stylesheet element
 */
function insertStyles(styles, _document, el) {
    styles.forEach(function (style) {
        var styleElement = _document.createElement('style');
        styleElement.appendChild(_document.createTextNode(style));
        _document.body.insertBefore(styleElement, el);
    });
}
function insertSingleCssFile(cssFilename, _document, el, log) {
    return cy.readFile(cssFilename, { log: log }).then(function (css) {
        var style = _document.createElement('style');
        style.appendChild(_document.createTextNode(css));
        _document.body.insertBefore(style, el);
    });
}
/**
 * Reads the given CSS file from local file system
 * and adds the loaded style text as an element.
 */
function insertLocalCssFiles(cssFilenames, _document, el, log) {
    return Cypress.Promise.mapSeries(cssFilenames, function (cssFilename) {
        return insertSingleCssFile(cssFilename, _document, el, log);
    });
}
/**
 * Injects custom style text or CSS file or 3rd party style resources
 * into the given document.
 */
exports.injectStylesBeforeElement = function (options, _document, el) {
    // first insert all stylesheets as Link elements
    var stylesheets = [];
    if (typeof options.stylesheet === 'string') {
        stylesheets.push(options.stylesheet);
    }
    else if (Array.isArray(options.stylesheet)) {
        stylesheets = stylesheets.concat(options.stylesheet);
    }
    if (typeof options.stylesheets === 'string') {
        options.stylesheets = [options.stylesheets];
    }
    if (options.stylesheets) {
        stylesheets = stylesheets.concat(options.stylesheets);
    }
    insertStylesheets(stylesheets, _document, el);
    // insert any styles as <style>...</style> elements
    var styles = [];
    if (typeof options.style === 'string') {
        styles.push(options.style);
    }
    else if (Array.isArray(options.style)) {
        styles = styles.concat(options.style);
    }
    if (typeof options.styles === 'string') {
        styles.push(options.styles);
    }
    else if (Array.isArray(options.styles)) {
        styles = styles.concat(options.styles);
    }
    insertStyles(styles, _document, el);
    // now load any css files by path and add their content
    // as <style>...</style> elements
    var cssFiles = [];
    if (typeof options.cssFile === 'string') {
        cssFiles.push(options.cssFile);
    }
    else if (Array.isArray(options.cssFile)) {
        cssFiles = cssFiles.concat(options.cssFile);
    }
    if (typeof options.cssFiles === 'string') {
        cssFiles.push(options.cssFiles);
    }
    else if (Array.isArray(options.cssFiles)) {
        cssFiles = cssFiles.concat(options.cssFiles);
    }
    return insertLocalCssFiles(cssFiles, _document, el, options.log);
};
/**
 * Remove any style or extra link elements from the iframe placeholder
 * left from any previous test
 *
 */
function cleanupStyles() {
    var _document = dom_1.getDocument();
    var styles = _document.body.querySelectorAll('style');
    styles.forEach(function (styleElement) {
        _document.body.removeChild(styleElement);
    });
    var links = _document.body.querySelectorAll('link[rel=stylesheet]');
    links.forEach(function (link) {
        _document.body.removeChild(link);
    });
}
exports.cleanupStyles = cleanupStyles;
