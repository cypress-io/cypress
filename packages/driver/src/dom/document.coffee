$jquery = require("./jquery")

docNode = Node.DOCUMENT_NODE

isDocument = (obj) ->
  try
    if $jquery.isJquery(obj)
      obj = obj[0]

    Boolean(obj and obj.nodeType is docNode)
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
