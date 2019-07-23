const $jquery = require('./jquery')

const docNode = window.Node.DOCUMENT_NODE

const isDocument = (obj) => {
  try {
    if ($jquery.isJquery(obj)) {
      obj = obj[0]
    }

    return Boolean(obj && obj.nodeType === docNode)
  } catch (error) {
    return false
  }
}

// does this document have a currently active window (defaultView)
const hasActiveWindow = (doc) => {
  return !!doc.defaultView
}

const getDocumentFromElement = (el) => {
  if (isDocument(el)) {
    return el
  }

  return el.ownerDocument
}

module.exports = {
  isDocument,

  hasActiveWindow,

  getDocumentFromElement,
}
