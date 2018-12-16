$jquery = require("./jquery")
$document = require("./document")

getWindowByElement = (el) ->
  if isWindow(el)
    return el

  doc = $document.getDocumentFromElement(el)
  getWindowByDocument(doc)

getWindowByDocument = (doc) ->
  ## parentWindow for IE
  doc.defaultView or doc.parentWindow

isWindow = (obj) ->
  try
    if $jquery.isJquery(obj)
      obj = obj[0]

    Boolean(obj and obj.window is obj)
  catch
    false

module.exports = {
  getWindowByElement

  getWindowByDocument

  isWindow
}
