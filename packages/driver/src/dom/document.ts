const $jquery = require('./jquery')

const docNode = window.Node.DOCUMENT_NODE
const docFragmentNode = window.Node.DOCUMENT_FRAGMENT_NODE

//TODO: make this not allow jquery
const isDocument = (obj: Node | JQuery): obj is Document => {
  try {
    let node = obj as Node

    if ($jquery.isJquery(obj)) {
      node = obj[0]
    }

    return node?.nodeType === docNode || node?.nodeType === docFragmentNode
  } catch (error) {
    return false
  }
}

// does this document have a currently active window (defaultView)
const hasActiveWindow = (doc) => {
  // in firefox, detached documents still have a reference to their window
  // but document.location is null
  if (Cypress.isBrowser('firefox') && !doc.location) {
    return false
  }

  return !!doc.defaultView
}

const getDocumentFromElement = (el: Node): Document => {
  if (isDocument(el)) {
    return el
  }

  return el.ownerDocument as Document
}

export {
  isDocument,

  hasActiveWindow,

  getDocumentFromElement,
}
