@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Layout extends App.Views.LayoutView
    template: "test_iframe/show/iframe"

    ui:
      size: "#iframe-size-container"

    modelEvents:
      "resize:viewport"   : "resizeViewport"
      "revert:dom"        : "revertDom"
      "restore:dom"       : "restoreDom"
      "highlight:el"      : "highlightEl"

    resizeViewport: ->
      @ui.size.css {
        width:  @model.get("viewportWidth")
        height: @model.get("viewportHeight")
      }

      @calcWidth()

    restoreDom: (originalBody) ->
      @$el
        .find("iframe.iframe-remote")
          .contents()
            .find("body")
              .replaceWith(originalBody)

    detachBody: ->
      body = @$remote.contents().find("body")
      body.find("script").remove()
      body.detach()

    revertDom: (snapshot) ->
      contents = @$remote.contents()
      contents.find("body").remove()
      contents.find("html").append(snapshot)

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 1000 else Number el.css("zIndex")

    highlightEl: (el, options = {}) ->
      _.defaults options,
        init: true

      @$remote.contents().find("[data-highlight-el],[data-highlight-hitbox]").remove()

      if options.dom
        dom = options.dom
        el  = options.dom.find("[" + options.highlightAttr + "]")
      else
        dom = @$remote.contents().find("body")

      ## scroll the top of the element into view
      if el.get(0)
        el.get(0).scrollIntoView()
        ## if we have a scrollBy on our command
        ## then we need to additional scroll the window
        ## by these offsets
        if scrollBy = options.scrollBy
          @$remote.prop("contentWindow").scrollBy(scrollBy.x, scrollBy.y)

      el.each (index, el) =>
        el = $(el)

        ## bail if our el no longer exists in the parent dom
        return if not @elExistsInDocument(dom, el)

        ## bail if our el isnt visible either
        return if not el.is(":visible")

        dimensions = @getDimensions(el)

        ## dont show anything if our element displaces nothing
        return if dimensions.width is 0 or dimensions.height is 0

        div = App.request("element:box:model:layers", el, dom)
        div.attr("data-highlight-el", true)

      if coords = options.coords
        setImmediate =>
          box = App.request("element:hit:box:layer", coords, dom)
          box.attr("data-highlight-hitbox", true)

    elExistsInDocument: (parent, el) ->
      $.contains parent[0], el[0]

    getDimensions: (el) ->
      {
        width: el.width()
        height: el.height()
      }

    calcWidth: (main, tests, container, headerHeight) ->
      headerHeight = @$("header").outerHeight() ? 52

      width  = main.width() - tests.width()
      height = container.height() - headerHeight ## accounts for the header

      container.width(width)

      @calcScale(width, height)

    calcScale: (width, height) ->
      size = @ui.size

      iframeWidth  = size.width()
      iframeHeight = size.height()

      ## move all of this logic into model methods
      if width < iframeWidth or height < iframeHeight
        scale = Math.min(width / iframeWidth, height / iframeHeight, 1).toFixed(4)
      else
        scale = 1

      left = (width / 2) - (iframeWidth / 2)

      size.css({transform: "scale(#{scale})", marginLeft: left})
      @model.setScale(scale)

    onShow: ->
      main      = $("#main-region>:first-child")
      tests     = $("#test-container")
      container = $("#iframe-wrapper")

      @calcWidth = _(@calcWidth).chain().bind(@).partial(main, tests, container).value()

      @resizeViewport()

      $(window).on "resize", @calcWidth

    onDestroy: ->
      $(window).off "resize", @calcWidth

      @resetReferences()

    resetReferences: ->
      # _.each ["Ecl", "$", "jQuery", "parent", "chai", "expect", "should", "assert", "Mocha", "mocha"], (global) =>
      #   delete @$iframe[0].contentWindow[global]

      @$iframe?[0].contentWindow.remote = null

      @$iframe?.remove()
      @$remote?.remove()

      @$remote      = null
      @$iframe      = null
      @fn           = null

    loadIframes: (options, fn) ->
      src = options.specPath
      ## remove any existing iframes
      # @reverted = false
      # @ui.message.hide().empty()

      @resetReferences()

      @$el.hide()

      if App.config.ui("host")
        @loadSatelitteIframe(src, options, fn)
      else
        @loadRegularIframes(src, options, fn)

    loadSatelitteIframe: (src, options, fn) ->
      view = @

      url = encodeURIComponent("http://tunnel.browserling.com:55573/#tests/#{src}?__ui=satellite")

      src = if options.browser and options.version
        @browserChanged options.browser, options.version
        "https://browserling.com/browse/#{options.browser}/#{options.version}/#{url}"
      else
        ## this needs to be a dynamic port!
        "http://localhost:2020/#tests/#{src}?__ui=satellite"

      remoteOpts =
        id: "iframe-remote"
        src: src
        load: ->
          fn(null, view.$remote)
          view.$el.show()
          view.calcWidth()

      @$remote = $("<iframe />", remoteOpts).appendTo(@ui.size)

    loadRegularIframes: (src, options, fn) ->
      view = @

      @src = "/__cypress/iframes/" + src
      @fn = fn

      # @$iframe = window.open(@src, "testIframeWindow", "titlebar=no,menubar=no,toolbar=no,location=no,personalbar=no,status=no")
      # @$iframe.onload = =>
      #   fn(@$iframe)

      remoteLoaded = $.Deferred()
      iframeLoaded = $.Deferred()

      name = App.config.getProjectName()

      remoteOpts =
        id: "Your App: '#{name}' "
        class: "iframe-remote"

      @$remote = $("<iframe>", remoteOpts).appendTo(@ui.size)

      contents = Marionette.Renderer.render("test_iframe/show/_default_message")
      view.$remote.contents().find("body").append(contents)
      remoteLoaded.resolve(view.$remote)

      remoteLoaded.done =>
        @$iframe = $ "<iframe />",
          id: "Your Spec: '#{src}' "
          class: "iframe-spec"

        @$iframe.appendTo(@$el)

        @$iframe.prop("src", @src).one "load", ->
          ## make a reference between the iframes
          @contentWindow.remote = view.$remote[0].contentWindow

          iframeLoaded.resolve(@contentWindow)
          view.$el.show()
          view.calcWidth()
          # view.ui.header.show()

      $.when(remoteLoaded, iframeLoaded).done (remote, iframe) =>
        ## yes these args are supposed to be reversed
        ## TODO FIX THIS
        fn(iframe, remote)

  class Show.Header extends App.Views.ItemView
    template: "test_iframe/show/_header"

    ui:
      message:       "#iframe-message"
      dropdown:      ".dropdown"
      button:        ".dropdown-toggle"
      choices:       ".dropdown-menu li a"
      browser:       ".browser-versions li"
      chosenBrowser: "#chosen-manual-browser"
      closeBrowser:  "#chosen-manual-browser i"
      url:           "#url-container input"
      width:         "#viewport-width"
      height:        "#viewport-height"
      scale:         "#viewport-scale"
      viewport:      "#viewport-wrapper"

    events:
      "click @ui.expand"        : "expandClicked"
      "click @ui.compress"      : "compressClicked"
      "click @ui.button"        : "buttonClicked"
      "click @ui.choices"       : "choicesClicked"
      "click @ui.browser"       : "browserClicked"
      "click @ui.closeBrowser"  : "closeBrowserClicked"
      "click @ui.viewport"      : "viewportClicked"
      "show.bs.dropdown"        : "dropdownShow"
      "hide.bs.dropdown"        : "dropdownHide"

    modelEvents:
      "change:url"            : "urlChanged"
      "change:pageLoading"    : "pageLoadingChanged"
      "change:viewportWidth"  : "widthChanged"
      "change:viewportHeight" : "heightChanged"
      "change:viewportScale"  : "scaleChanged"
      "cannot:revert:dom"     : "cannotRevertDom"
      "revert:dom"            : "revertDom"
      "restore:dom"           : "restoreDom"

    urlChanged: (model, value, options) ->
      @ui.url.val(value)

    pageLoadingChanged: (model, value, options) ->
      ## hides or shows the loading indicator
      @ui.url.parent().toggleClass("loading", value)

    widthChanged: (model, value) ->
      @ui.width.text(value)

    heightChanged: (model, value) ->
      @ui.height.text(value)

    scaleChanged: (model, value) ->
      @ui.scale.text model.get("viewportScale")

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

    cannotRevertDom: (init) ->
      @ui.message.text("Cannot revert DOM while tests are running").addClass("cannot-revert").show()

    restoreDom: ->
      @ui.message.removeClass("cannot-revert").empty().hide()

    revertDom: ->
      @ui.message.text("DOM has been reverted").removeClass("cannot-revert").show()

    viewportClicked: (e) ->
      e.stopPropagation()

    dropdownShow: (e) ->
      return if not @$iframe

      ## the bootstrap namespace for click events
      ## ie click.bs.bootstrap
      eventNamespace = @getBootstrapNameSpaceForEvent("click", e)

      ## binds to the $iframe document's click event
      ## and repropogates this to our document
      ## we do this because bootstrap will only bind
      ## to our documents click event and not our iframes
      ## so clicking into our iframe should close the dropdown
      @$iframe.contents().one eventNamespace, (e) =>
        $(document).trigger(eventNamespace, e)

    dropdownHide: (e) ->
      return if not @$iframe

      ## the bootstrap namespace for click events
      ## ie click.bs.bootstrap
      eventNamespace = @getBootstrapNameSpaceForEvent("click", e)

      ## we always want to remove our old custom handlers
      ## when the drop down is closed to clean up references
      @$iframe.contents().off eventNamespace