$Cypress.Server2 = do ($Cypress, _) ->

  class $Server
    constructor: (contentWindow, options = {}) ->
      _.defaults options,
        onSend: ->
        onAbort: ->
        onError: ->
        onLoad: ->

      ## what about holding a reference to the test id?
      ## to prevent cross pollution of requests?

      ## what about restoring the server?
      @isActive = true
      @xhrs = {}

      server = @

      XHR = contentWindow.XMLHttpRequest
      send = XHR.prototype.send
      open = XHR.prototype.open

      XHR.prototype.open = (method, url, async, username, password) ->
        server.add(@, {
          method: method
          url: url
        })

        ## i think we'll need to keep a reference of each XHR
        ## to be able to log it out successfully

        ## change absolute url's to relative ones
        ## if they match our baseUrl / visited URL
        open.apply(@, arguments)

      XHR.prototype.send = ->
        ## dont send anything if our server isnt active
        ## anymore
        return if not server.isActive

        ## log this out now since it's being sent officially
        options.onSend(@)

        ## wait until the last possible moment to attach to onreadystatechange
        orst = @onreadystatechange
        @onreadystatechange = ->
          @readyState

        _.defer =>
          send.apply(@, arguments)

    find: (xhr) ->
      @xhrs[xhr.id]

    add: (xhr, attrs = {}) ->
      _.extend(xhr, attrs)
      xhr.id = id = _.uniqueId("xhr")
      @xhrs[id] = xhr

    restore: ->
      @isActive = false

      ## abort any outstanding xhr's

    @initialize = (contentWindow, options) ->
      new $Server(contentWindow, options)

  return $Server