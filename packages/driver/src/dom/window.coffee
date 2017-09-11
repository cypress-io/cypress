$ = require("jquery")

getWindowByDocument = (doc) ->
  ## parentWindow for IE
  doc.defaultView or doc.parentWindow

isWindow = (obj) ->
  try
    !!(obj and $.isWindow(obj[0])) or $.isWindow(obj)
  catch
    false

module.exports = {
  getWindowByDocument

  isWindow
}
