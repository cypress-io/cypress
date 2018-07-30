docNode = Node.DOCUMENT_NODE

isDocument = (obj) ->
  try
    !!((obj and obj.nodeType is docNode) or (obj and obj[0] and obj[0].nodeType is docNode))
  catch
    false

hasActiveWindow = (doc) ->
  ## does this document have a currently active window (defaultView)
  return !!doc.defaultView

getDocumentFromElement = (el) ->
  if isDocument(el)
    return el

  el.ownerDocument

module.exports = {
  isDocument

  hasActiveWindow

  getDocumentFromElement
}
