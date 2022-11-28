import $jquery from './jquery'
import $document from './document'

const getWindowByDocument = (doc) => {
  // parentWindow for IE
  return doc.defaultView || doc.parentWindow
}

const isWindow = function (obj) {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && obj.window === obj)
  } catch (error) {
    return false
  }
}

/**
 * @param {HTMLElement} el
 * @returns {Window & typeof globalThis}
 */
const getWindowByElement = function (el) {
  if (isWindow(el)) {
    return el
  }

  const doc = $document.getDocumentFromElement(el)

  return getWindowByDocument(doc)
}

export default {
  getWindowByDocument,
  getWindowByElement,
  isWindow,
}
