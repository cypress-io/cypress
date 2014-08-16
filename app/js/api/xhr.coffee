## attach to Eclectus global
Eclectus.Xhr = do ($, _) ->

  class Xhr
    constructor: (@server, @channel, @runnable) ->
      ## make sure to reset this on restore()
      @requests = []

      _this = @

      @server.addRequest = _.wrap @server.addRequest, (addRequestOrig, xhr) ->

        ## call the original addRequest method
        addRequestOrig.call @, xhr

        ## overload the xhr's onsend method so we log out when the request happens
        xhr.onSend = _.wrap xhr.onSend, (onSendOrig) ->

          ## push this into our requests array
          _this.requests.push xhr

          ## call the original so sinon does its thing
          onSendOrig.call(@)

          _this.channel.trigger "xhr", _this.runnable,
            method: xhr.method
            url:    xhr.url
            xhr:    xhr

        return xhr

    stub: (options = {}) ->


  return Xhr