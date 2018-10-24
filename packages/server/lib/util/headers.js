contentType  = require("content-type")

module.exports = {
  getContentType: (res, type) ->
    try
      contentType.parse(res).type
    catch err
      null

  hasContentType: (res, type) ->
    ## does the response object have a content-type
    ## that matches what we expect
    try
      contentType.parse(res).type is type
    catch err
      false
}