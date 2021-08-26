// @ts-nocheck

import * as $jquery from './jquery'
import * as $document from './document'

/**
 * @param {HTMLElement} el
 * @returns {Window & typeof globalThis}
 */
export const getWindowByElement = function (el) {
  if (isWindow(el)) {
    return el
  }

  const doc = $document.getDocumentFromElement(el)

  return getWindowByDocument(doc)
}

export const getWindowByDocument = (doc) => {
  // parentWindow for IE
  return doc.defaultView || doc.parentWindow
}

export const isWindow = function (obj) {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && obj.window === obj)
  } catch (error) {
    return false
  }
}
