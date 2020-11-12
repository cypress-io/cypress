"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
Object.defineProperty(exports, "__esModule", { value: true });
var common_tags_1 = require("common-tags");
function partial(domain) {
    return common_tags_1.oneLine(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    <script type='text/javascript'>\n      document.domain = '", "';\n    </script>\n  "], ["\n    <script type='text/javascript'>\n      document.domain = '", "';\n    </script>\n  "])), domain);
}
exports.partial = partial;
function full(domain) {
    return common_tags_1.oneLine(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n    <script type='text/javascript'>\n      document.domain = '", "';\n\n      var Cypress = window.Cypress = parent.Cypress;\n\n      if (!Cypress) {\n        throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!');\n      };\n\n      Cypress.action('app:window:before:load', window);\n    </script>\n  "], ["\n    <script type='text/javascript'>\n      document.domain = '", "';\n\n      var Cypress = window.Cypress = parent.Cypress;\n\n      if (!Cypress) {\n        throw new Error('Something went terribly wrong and we cannot proceed. We expected to find the global Cypress in the parent window but it is missing!. This should never happen and likely is a bug. Please open an issue!');\n      };\n\n      Cypress.action('app:window:before:load', window);\n    </script>\n  "])), domain);
}
exports.full = full;
var templateObject_1, templateObject_2;
