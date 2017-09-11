isDocument = (obj) ->
  try
    !!((obj and obj.nodeType is 9) or (obj and obj[0] and obj[0].nodeType is 9))
  catch
    false

hasActiveWindow = (doc) ->
  ## does this document have a currently active window (defaultView)
  return !!doc.defaultView

getDocumentFromElement = (el) ->
  el.ownerDocument

module.exports = {
  isDocument

  hasActiveWindow

  getDocumentFromElement
}
