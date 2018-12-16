/* eslint-disable
    brace-style,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $jquery = require('./jquery')
const $document = require('./document')

const getWindowByElement = function (el) {
  if (isWindow(el)) {
    return el
  }

  const doc = $document.getDocumentFromElement(el)

  return getWindowByDocument(doc)
}

const getWindowByDocument = (doc) =>
//# parentWindow for IE
{
  return doc.defaultView || doc.parentWindow
}

const isWindow = function (obj) {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && (obj.window === obj))
  } catch (error) {
    return false
  }
}

module.exports = {
  getWindowByElement,

  getWindowByDocument,

  isWindow,
}
