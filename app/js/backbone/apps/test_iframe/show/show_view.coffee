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

    revertToDom: (dom, options) ->
      ## replaces the iframes body with the dom object
      dom.replaceAll @$el.find("#iframe-remote").contents().find("body")

      @addRevertMessage(options)

      if options.el
        @highlightEl options.el,
          id:   options.id
          attr: options.attr
          dom:  dom

    addRevertMessage: (options) ->
      @reverted = true
      @ui.message.text("DOM has been reverted").show()

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 1000 else Number el.css("zIndex")

    highlightEl: (el, options = {}) ->
      _.defaults options,
        init: true

      @$remote.contents().find("[data-highlight-el]").remove() if not @reverted

      return if not options.init

      ## if we're not currently reverted
      ## and init is false then nuke the currently highlighted el
      # if not @reverted and not options.init
        # return @$iframe.contents().find("[data-highlight-el='#{options.id}']").remove()

      if options.dom
        dom = options.dom
        el  = options.dom.find("[" + options.attr + "]")
      else
        dom = @$remote.contents().find("body")

      el.each (index, el) =>
        el = $(el)

        ## bail if our el no longer exists in the parent dom
        return if not @elExistsInDocument(dom, el)

        ## bail if our el isnt visible either
        return if not el.is(":visible")

        dimensions = @getDimensions(el)

        ## dont show anything if our element displaces nothing
        return if dimensions.width is 0 or dimensions.height is 0

        _.defer =>
          div = App.request("element:box:model:layers", el, dom)
          div.attr("data-highlight-el", options.id)

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
      #   delete @$iframe[0].contentWindow[global]

      @removeIframeWindowListeners() if @$remote?.isReadable()

      @$iframe?[0].contentWindow.remote = null

      @$iframe?.remove()
      @$remote?.remove()

      @$remote = null
      @$iframe = null
      @fn      = null

    removeIframeWindowListeners: ->
      $(@$remote.prop("contentWindow")).off "hashchange", @updateRemoteUrl
      $(@$remote.prop("contentWindow")).off "popstate",   @updateRemoteUrl

    loadIframe: (src, options, fn) ->
      ## remove any existing iframes
      @reverted = false
      @ui.message.hide().empty()

      ## if we have a remote iframe then remove any
      ## listeners for load and unload
      @$remote?.off("load").off("unload")

      @resetReferences()

      @$el.hide()

      if App.config.env("host")
        @loadSatelitteIframe(src, options, fn)
      else
        @loadRegularIframes(src, options, fn)

    loadSatelitteIframe: (src, options, fn) ->
      view = @

      url = encodeURIComponent("http://tunnel.browserling.com:55573/#tests/#{src}?__env=satellite")

      src = if options.browser and options.version
        @browserChanged options.browser, options.version
        "https://browserling.com/browse/#{options.browser}/#{options.version}/#{url}"
      else
        "http://localhost:3000/#tests/#{src}?__env=satellite"

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

      @src = "/iframes/" + src
      @fn = fn

      # @$iframe = window.open(@src, "testIframeWindow", "titlebar=no,menubar=no,toolbar=no,location=no,personalbar=no,status=no")
      # @$iframe.onload = =>
      #   fn(@$iframe)


      ## we first need to resolve the remote iframe
      ## because if we've set a defaultPage that means
      ## it needs to be in the DOM before we load our iframe
      ## which may reference the remote window
      ## if we don't have a defaultPage we just immediately
      ## resolve the remote iframe so either way it works
      remoteLoaded = $.Deferred()
      iframeLoaded = $.Deferred()

      remoteOpts =
        id: "iframe-remote"

      ## if our config model has configured defaultPage
      ## then we need to immediately load that
      ## as our remote iframe and wait for it to load
      if defaultPage = @model.get("defaultPage")
        _.extend remoteOpts,
        src: Cypress.Location.createInitialRemoteSrc(defaultPage)
          load: ->
            remoteLoaded.resolve(view.$remote)

      @$remote = $("<iframe />", remoteOpts).appendTo(@ui.size)

      ## when the remote iframe visits an external URL
      ## we want to update our header's input
      @$remote.on "visit:start", (e, url) =>
        @showSpinner()
        @updateRemoteUrl(url)
        @setRemoteOrigin(url)

        ## remove any existing hashchange and popstate listeners
        ## whenever we visit we will lose these listeners anyway
        ## and will need to re-add them later
        @removeIframeWindowListeners()

      @$remote.on "load", =>
        @showSpinner(false)
        @updateRemoteUrl()

        @removeIframeWindowListeners()

        ## must re-wrap the contentWindow to get the hashchange/popstate event
        ## any time our remote window loads we need to bind to these events
        $(@$remote.prop("contentWindow")).on "hashchange", @updateRemoteUrl
        $(@$remote.prop("contentWindow")).on "popstate",   @updateRemoteUrl
        # $(@$remote.prop("contentWindow")).on "unload",     -> #debugger

      ## if our config model hasnt been configured with defaultPage
      ## then we immediately resolve our remote iframe
      ## and push the default message content into it
      if not defaultPage
        contents = Marionette.Renderer.render("test_iframe/show/_default_message")
        view.$remote.contents().find("body").append(contents)
        remoteLoaded.resolve(view.$remote)

      remoteLoaded.done =>
        @$iframe = $ "<iframe />",
          src: @src
          id: "iframe-spec"
          load: ->
            iframeLoaded.resolve(@contentWindow)
            view.$el.show()
            view.calcWidth()
            # view.ui.header.show()

        @$iframe.appendTo(@$el)

        ## make a reference between the iframes
        @$iframe[0].contentWindow.remote = view.$remote[0].contentWindow

      $.when(remoteLoaded, iframeLoaded).done (remote, iframe) ->
        ## yes these args are supposed to be reversed
        ## TODO FIX THIS
        fn(iframe, remote)

    setRemoteOrigin: (url) ->
      currentUrl = window.location.toString()
      App.config.setRemoteOrigin(currentUrl, url)

    updateRemoteUrl: (remoteUrl) =>
      remoteUrl = if _.isString(remoteUrl) then remoteUrl else @$remote.prop("contentWindow").location.toString()

      if remoteUrl is "about:blank"
        location = {href: "about:blank"}
      else
        currentUrl    = window.location.toString()
        defaultOrigin = App.config.get("remoteOrigin")

        location = Cypress.location(currentUrl, remoteUrl, defaultOrigin)

      @ui.url.val(location.href)

    parseHashChangeUrl: (url) ->
      ## returns the very last part
      ## of the url split by the hash
      ## think about figuring out what the base
      ## URL is if we've set a defaultPage file
      "#" + _.last(url.split("#"))

    showSpinner: (bool = true) ->
      ## hides or shows the loading indicator
      @ui.url.parent().toggleClass("loading", bool)

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
