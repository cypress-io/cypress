/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $jquery = require("./jquery");

const docNode = Node.DOCUMENT_NODE;

const isDocument = function(obj) {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0];
    }

    return Boolean(obj && (obj.nodeType === docNode));
  } catch (error) {
    return false;
  }
};

const hasActiveWindow = doc =>
  //# does this document have a currently active window (defaultView)
  !!doc.defaultView
;

const getDocumentFromElement = function(el) {
  if (isDocument(el)) {
    return el;
  }

  return el.ownerDocument;
};

module.exports = {
  isDocument,

  hasActiveWindow,

  getDocumentFromElement
};
