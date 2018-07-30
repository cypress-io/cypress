$ = require("jquery")
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
    !!(obj and $.isWindow(obj[0])) or $.isWindow(obj)
  catch
    false

module.exports = {
  getWindowByElement

  getWindowByDocument

  isWindow
}
