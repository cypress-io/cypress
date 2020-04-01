$utils = require("./utils")
$errUtils = require("./error_utils")

isCypressHeaderRe = /^X-Cypress-/i

parseJSON = (text) ->
  try
    JSON.parse(text)
  catch
    text

## maybe rename this to XMLHttpRequest ?
## so it shows up correctly as an instance in the console
class XMLHttpRequest
  constructor: (@xhr) ->
    @id            = @xhr.id
    @url           = @xhr.url
    @method        = @xhr.method
    @status        = null
    @statusMessage = null
    @request       = {}
    @response      = null

  _getXhr: ->
    @xhr ? $errUtils.throwErrByPath("xhr.missing")

  _setDuration: (timeStart) ->
    @duration = (new Date) - timeStart

  _setStatus: ->
    @status = @xhr.status
    @statusMessage = "#{@xhr.status} (#{@xhr.statusText})"

  _setRequestBody: (requestBody = null) ->
    @request.body = parseJSON(requestBody)

  _setResponseBody: ->
    @response ?= {}

    ## if we are a responseType of arraybuffer
    ## then touching responseText will throw and
    ## our ArrayBuffer should just be on the response
    ## object
    @response.body =
      try
        parseJSON(@xhr.responseText)
      catch e
        @xhr.response

  _setResponseHeaders: ->
    ## parse response header string into object
    ## https://gist.github.com/monsur/706839
    headerStr = @xhr.getAllResponseHeaders()

    set = (resp) =>
      @response ?= {}
      @response.headers = resp

    headers = {}
    if not headerStr
      return set(headers)

    headerPairs = headerStr.split('\u000d\u000a')
    for headerPair in headerPairs
      # Can't use split() here because it does the wrong thing
      # if the header value has the string ": " in it.
      index = headerPair.indexOf('\u003a\u0020')
      if index > 0
        key = headerPair.substring(0, index)
        val = headerPair.substring(index + 2)
        headers[key] = val

    set(headers)

  _getFixtureError: ->
    body = @response and @response.body

    if body and err = body.__error
      return err

  _setRequestHeader: (key, val) ->
    return if isCypressHeaderRe.test(key)

    @request.headers ?= {}

    current = @request.headers[key]

    ## if we already have a request header
    ## then prepend val with ', '
    if current
      val = current + ", " + val

    @request.headers[key] = val

  setRequestHeader: ->
    @xhr.setRequestHeader.apply(@xhr, arguments)

  getResponseHeader: ->
    @xhr.getResponseHeader.apply(@xhr, arguments)

  getAllResponseHeaders: ->
    @xhr.getAllResponseHeaders.apply(@xhr, arguments)

  @add = (xhr) ->
    new XMLHttpRequest(xhr)

Object.defineProperties XMLHttpRequest.prototype,
  requestHeaders: {
    get: ->
      @request?.headers
  }

  requestBody: {
    get: ->
      @request?.body
  }

  responseHeaders: {
    get: ->
      @response?.headers
  }

  responseBody: {
    get: ->
      @response?.body
  }

  requestJSON: {
    get: ->
      $errUtils.warnByPath("xhr.requestjson_deprecated")
      @requestBody
  }

  responseJSON: {
    get: ->
      $errUtils.warnByPath("xhr.responsejson_deprecated")
      @responseBody
  }

create = (xhr) ->
  new XMLHttpRequest(xhr)

module.exports = {
  create
}
