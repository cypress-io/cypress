@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Iframe extends App.Views.ItemView
    template: "test_iframe/show/iframe"

    ui:
      # header:   "header"
      size:          "#iframe-size-container"
      expand:        ".fa-expand"
      compress:      ".fa-compress"
      message:       "#iframe-message"
      dropdown:      ".dropdown"
      sliders:       ".slider"
      button:        ".dropdown-toggle"
      choices:       ".dropdown-menu li a"
      browser:       ".browser-versions li"
      chosenBrowser: "#chosen-manual-browser"
      closeBrowser:  "#chosen-manual-browser i"
      url:           "#url-container input"

    events:
      "click @ui.expand"        : "expandClicked"
      "click @ui.compress"      : "compressClicked"
      "click @ui.button"        : "buttonClicked"
      "click @ui.choices"       : "choicesClicked"
      "click @ui.browser"       : "browserClicked"
      "click @ui.closeBrowser"  : "closeBrowserClicked"
      "show.bs.dropdown"        : "dropdownShow"
      "hide.bs.dropdown"        : "dropdownHide"
    #   "click #perf"         : "perfClicked"

    modelEvents:
      "change:url"         : "urlChanged"
      "change:pageLoading" : "pageLoadingChanged"

    urlChanged: (model, value, options) ->
      @ui.url.val(value)

    pageLoadingChanged: (model, value, options) ->
      ## hides or shows the loading indicator
      @ui.url.parent().toggleClass("loading", value)

    # perfClicked: (e) ->
    #   s = @$remote.contents().find("body").remove("script")
    #   t = Date.now()
    #   str = s.prop("outerHTML")
    #   console.log "prop outerHTML", Date.now() - t
    #   t = Date.now()
    #   str = @$remote.contents().find("body").prop("outerHTML")
    #   console.warn "body outerHTML", Date.now() - t

    closeBrowserClicked: (e) ->
      @trigger "close:browser:clicked"

    browserClicked: (e) ->
      el      = $(e.target)
      browser = el.parent().data("browser")
      version = el.text()

      @trigger "browser:clicked", browser, version

    browserChanged: (browser, version) ->
      @ui.chosenBrowser.html(
        Marionette.Renderer.render "test_iframe/show/_chosen_browser",
          browser: browser
          version: version
      )

    choicesClicked: (e) ->
      e.preventDefault()

    buttonClicked: (e) ->
      e.stopPropagation()
      @ui.button.parent().toggleClass("open")

    getBootstrapNameSpaceForEvent: (name, e) ->
      name + "." + e.namespace

    dropdownShow: (e) ->
      return if not @$specIframe

      ## the bootstrap namespace for click events
      ## ie click.bs.bootstrap
      eventNamespace = @getBootstrapNameSpaceForEvent("click", e)

      ## binds to the $specIframe document's click event
      ## and repropogates this to our document
      ## we do this because bootstrap will only bind
      ## to our documents click event and not our iframes
      ## so clicking into our iframe should close the dropdown
      @$specIframe.contents().one eventNamespace, (e) =>
        $(document).trigger(eventNamespace, e)

    dropdownHide: (e) ->
      return if not @$specIframe

      ## the bootstrap namespace for click events
      ## ie click.bs.bootstrap
      eventNamespace = @getBootstrapNameSpaceForEvent("click", e)

      ## we always want to remove our old custom handlers
      ## when the drop down is closed to clean up references
      @$specIframe.contents().off eventNamespace

    restoreDom: ->
      return if not @originalBody

      do =>
        ## backup the current command's detachedId
        previousDetachedId = @detachedId

        ## we're using a setImmediate here because mouseleave will fire
        ## before mouseenter.  and we dont want to restore the dom if we're
        ## able to be hovering over a different command, else that would
        ## be a huge waste.
        setImmediate =>
          ## we want to only restore the dom if we havent hovered over
          ## to another command by the time this setImmediate function runs
          return if previousDetachedId isnt @detachedId

          @$el.find("iframe.iframe-remote").contents().find("body").replaceWith(@originalBody)

          @removeRevertMessage()

          @detachedId = null

    cannotRevertDom: (init) ->
      if init
        @ui.message.text("Cannot revert DOM while tests are running").addClass("cannot-revert").show()
      else
        @removeRevertMessage()

    revertToDom: (dom, options) ->
      ## replaces the iframes body with the dom object
      contents = @$remote.contents()

      if not @originalBody
        body = contents.find("body")
        body.find("script").remove()
        @originalBody = body.detach()
      else
        contents.find("body").remove()

      @detachedId = options.id

      ## potentially think about making this setImmediate for
      ## either perf reason or if we want the screen to "blink"
      ## after its removed above
      contents.find("html").append(dom)

      @addRevertMessage(options)

      if options.el
        @highlightEl options.el,
          coords: options.coords
          id:     options.id
          attr:   options.attr
          dom:    dom

    addRevertMessage: (options) ->
      @reverted = true
      @ui.message.text("DOM has been reverted").show()

    removeRevertMessage: ->
      @reverted = false
      @ui.message.removeClass("cannot-revert").empty().hide()

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 1000 else Number el.css("zIndex")

    highlightEl: (el, options = {}) ->
      _.defaults options,
        init: true

      @$remote.contents().find("[data-highlight-el],[data-highlight-hitbox]").remove()

      # # if we're not currently reverted
      # # and init is false then nuke the currently highlighted el
      # if not @reverted and not options.init
      #   return @$specIframe.contents().find("[data-highlight-el='#{options.id}']").remove()

      if options.dom
        dom = options.dom
        el  = options.dom.find("[" + options.attr + "]")
      else
        dom = @$remote.contents().find("body")

      ## scroll the bottom of the element into view
      el.get(0).scrollIntoView(false) if el.get(0)

      el.each (index, el) =>
        el = $(el)

        ## bail if our el no longer exists in the parent dom
        return if not @elExistsInDocument(dom, el)

        ## bail if our el isnt visible either
        return if not el.is(":visible")

        dimensions = @getDimensions(el)

        ## dont show anything if our element displaces nothing
        return if dimensions.width is 0 or dimensions.height is 0

        setImmediate =>
          div = App.request("element:box:model:layers", el, dom)
          div.attr("data-highlight-el", options.id)

      if coords = options.coords
        setImmediate =>
          box = App.request("element:hit:box:layer", coords, dom)
          box.attr("data-highlight-hitbox")

    elExistsInDocument: (parent, el) ->
      $.contains parent[0], el[0]

    getDimensions: (el) ->
      {
        width: el.width()
        height: el.height()
      }

    calcWidth: (main, tests, container) ->
      _.defer ->
        container.width main.width() - tests.width()

    updateIframeCss: (name, val) ->
      switch name
        when "height", "width"
          @ui.size.css(name, val + "%")
        when "scale"
          num = (val / 100)
          @ui.size.css("transform", "scale(#{num})")

    onShow: ->
      main      = $("#main-region :first-child")
      tests     = $("#test-container")
      container = $("#iframe-wrapper")

      view = @

      @ui.sliders.slider
        range: "min"
        min: 1
        max: 100
        slide: (e, ui) ->
          name = $(@).parents(".form-group").find("input").val(ui.value).prop("name")
          view.updateIframeCss(name, ui.value)

      @ui.sliders.each (index, slider) ->
        $slider = $(slider)
        val = $slider.parents(".form-group").find("input").val()
        $slider.slider("value", val)

      @calcWidth = _(@calcWidth).partial main, tests, container

      $(window).on "resize", @calcWidth

      # @ui.header.hide()
      @ui.compress.hide()

    onDestroy: ->
      $(window).off "resize", @calcWidth

      @resetReferences()

    resetReferences: ->
      # _.each ["Ecl", "$", "jQuery", "parent", "chai", "expect", "should", "assert", "Mocha", "mocha"], (global) =>
      #   delete @$specIframe[0].contentWindow[global]

      @$specIframe?[0].contentWindow.remote = null

      @$specIframe?.remove()
      @$remote?.remove()

      @$remote      = null
      @$specIframe  = null
      @fn           = null
      @detachedBody = null
      @originalBody = null

    loadIframe: (src, options, fn) ->
      ## remove any existing iframes
      @reverted = false
      @ui.message.hide().empty()

      @resetReferences()

      @$el.hide()

      if App.config.ui("host")
        @loadSatelitteIframe(src, options, fn)
      else
        @loadRegularIframes(src, options, fn)

    loadSatelitteIframe: (src, options, fn) ->
      view = @

      @browserChanged options.browser, options.version

      url = encodeURIComponent("http://tunnel.browserling.com:50228/#/tests/#{src}?__ui=satellite")

      insertIframe = =>
        browserling = new Browserling("29051e55f59c35e17a571bcf3f145910")
        browserling.configure
          browser: options.browser
          version: options.version
          url: url

        $specIframe = $(browserling.iframe())

        $specIframe.addClass("iframe-remote")
        $specIframe.load ->
          view.calcWidth()
          view.$el.show()
          fn(null, view.$remote)

        @$remote = $specIframe.appendTo(@ui.size)

      if not window.Browserling
        $.getScript("https://api.browserling.com/v1/browserling.js").done ->
          insertIframe()

      else
        insertIframe()

    loadRegularIframes: (src, options, fn) ->
      view = @

      @src = "/__cypress/iframes/" + src
      @fn = fn

      # @$specIframe = window.open(@src, "testIframeWindow", "titlebar=no,menubar=no,toolbar=no,location=no,personalbar=no,status=no")
      # @$specIframe.onload = =>
      #   fn(@$specIframe)

      remoteLoaded = $.Deferred()
      specLoaded = $.Deferred()

      name = App.config.getProjectName()

      remoteOpts =
        id: "Your App: '#{name}' "
        class: "iframe-remote"

      @$remote = $("<iframe>", remoteOpts).appendTo(@ui.size)

      contents = Marionette.Renderer.render("test_iframe/show/_default_message")
      view.$remote.contents().find("body").append(contents)
      remoteLoaded.resolve(view.$remote)

      remoteLoaded.done =>
        @$specIframe = $ "<iframe />",
          id: "Your Spec: '#{src}' "
          class: "iframe-spec"

        @$specIframe.appendTo(@$el)

        @$specIframe.prop("src", @src).one "load", ->
          ## make a reference between the iframes
          @contentWindow.remote = view.$remote[0].contentWindow

          specLoaded.resolve(@contentWindow)
          view.$el.show()
          view.calcWidth()
          # view.ui.header.show()

      $.when(remoteLoaded, specLoaded).done (remote, iframe) ->
        ## yes these args are supposed to be reversed
        ## TODO FIX THIS
        fn(iframe, remote)

    expandClicked: (e) ->
      @ui.expand.hide()
      @ui.compress.show()

      @$el.find("iframe").hide()
      ## display the iframe header in an 'external' mode
      ## swap out fa-expand with fa-compress

      @externalWindow = window.open(@src, "testIframeWindow", "titlebar=no,menubar=no,toolbar=no,location=no,personalbar=no,status=no")
      # console.warn @externalWindow, @fn
      # @externalWindow.onload =>
        # console.warn "externalWindow ready!"
        # @fn(@externalWindow)

      # @externalWindow
      ## when the externalWindow is open, keep the iframe around but proxy
      ## the ECL and dom commands to it

    compressClicked: (e) ->
      @ui.compress.hide()
      @ui.expand.show()

      @$el.find("iframe").show()
      @externalWindow.close?()
