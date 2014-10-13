## attach to Eclectus global

Eclectus.Visit = do ($, _, Eclectus) ->

  class Visit extends Eclectus.Command
    config:
      type: "visit"

    initialize: ->
      @canBeParent = false

    log: (url, options, fn) ->
      ## when the remote iframe's load event fires
      ## callback fn
      # debugger
      ## navigate the remote iframe to the url

      ## when our iframe navigates to 'about:blank'
      ## this callback will fire
      ## here is where we inject sinon into the window
      @$remoteIframe.one "load", =>

        script = $("<script />", type: "text/javascript")
        @$remoteIframe.contents().find("head").append(script)

        $.get "/eclectus/js/sinon.js", (resp) =>
          script.text(resp)

          ## invoke onBeforeLoad if it exists
          options.onBeforeLoad?(@$remoteIframe[0].contentWindow)

          ## must defer here for some reason... unknown
          _.defer =>
            ## we setup a new load handler which will fire after we reopen
            ## and close our document
            ## we pipe in the new ajax'd contents into the document
            @$remoteIframe.one "load", =>
              options.onLoad?(@$remoteIframe[0].contentWindow)
              fn()

            encodedUrl = encodeURIComponent(url)

            $.get("/external?url=#{encodedUrl}").done (resp) =>
              $(@$remoteIframe[0].contentWindow.document).contents().html(resp)
              # @$remoteIframe[0].contentWindow.document.open()
              # @$remoteIframe[0].contentWindow.document.write(resp)
              # @$remoteIframe[0].contentWindow.document.close()

      ## any existing global variables will get nuked after it navigates
      # @$remoteIframe[0].contentWindow.location.href = "/__blank/"
      @$remoteIframe.prop "src", "/__remote/#{url}"

      @emit
        method: "visit"
        message: url
        page: @$remoteIframe

  return Visit