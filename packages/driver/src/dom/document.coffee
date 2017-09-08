isDocument = (obj) ->
  try
    !!((obj and obj.nodeType is 9) or (obj and obj[0] and obj[0].nodeType is 9))
  catch
    false

getDocumentFromElement = (el) ->
  el.ownerDocument

module.exports = {
  isDocument

  getDocumentFromElement
}
