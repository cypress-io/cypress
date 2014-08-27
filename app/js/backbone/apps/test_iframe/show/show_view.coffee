@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Iframe extends App.Views.ItemView
    template: "test_iframe/show/iframe"

    ui:
      # header:   "header"
      expand:   ".fa-expand"
      compress: ".fa-compress"
      message:  "#iframe-message"

    events:
      "click @ui.expand"    : "expandClicked"
      "click @ui.compress"  : "compressClicked"

    revertToDom: (dom, options) ->
      ## replaces the iframes body with the dom object
      dom.replaceAll @$el.find("iframe").contents().find("body")

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

      @iframe.contents().find("[data-highlight-el]").remove() if not @reverted

      return if not options.init

      ## if we're not currently reverted
      ## and init is false then nuke the currently highlighted el
      # if not @reverted and not options.init
        # return @iframe.contents().find("[data-highlight-el='#{options.id}']").remove()

      if options.dom
        dom = options.dom
        el  = options.dom.find("[" + options.attr + "]")
      else
        dom = @iframe.contents().find("body")

      el.each (index, el) =>
        el = $(el)
        dimensions = @getDimensions(el)

        ## dont show anything if our element displaces nothing
        ## or it no longer exists in the parent dom
        return if not @elExistsInDocument(dom, el) or dimensions.width is 0 or dimensions.height is 0

        _.defer =>
          $("<div>")
            .attr("data-highlight-el", options.id)
            .css
              width: dimensions.width - 6,
              height: dimensions.height - 6,
              top: dimensions.offset.top,
              left: dimensions.offset.left,
              position: "absolute",
              zIndex: @getZIndex(el)
              border: "3px solid #E94B3B"
            .appendTo(dom)

    elExistsInDocument: (parent, el) ->
      $.contains parent[0], el[0]

    getDimensions: (el) ->
      {
        offset: el.offset()
        width: el.outerWidth(false)
        height: el.outerHeight(false)
      }

    onShow: ->
      # @ui.header.hide()
      @ui.compress.hide()

    onDestroy: ->
      # _.each ["Ecl", "$", "jQuery", "parent", "chai", "expect", "should", "assert", "Mocha", "mocha"], (global) =>
      #   delete @iframe[0].contentWindow[global]
      @iframe?.remove()
      delete @iframe
      delete @fn

    loadIframe: (src, fn) ->
      ## remove any existing iframes
      @ui.message.hide().empty()
      @iframe?.remove()

      @$el.hide()

      view = @

      @src = "/iframes/" + src
      @fn = fn

      @iframe = $ "<iframe />",
        src: @src
        class: "iframe-spec"
        load: ->
          fn(@contentWindow)
          view.$el.show()
          # view.ui.header.show()

      @iframe.appendTo(@$el)

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


          # suite         = this.contentWindow.mocha.suite
          # suite.window  = this.contentWindow
          # suite.id      = id || _.uniqueId("suite")

          # suite.beforeAll(Ecl.beforeAll)

          # suite.afterEach(Ecl.afterEach)

          # // add the suite to the stats
          # stats.suites[suite.id] = {
            # suite: suite,
            # passed: 0,
            # failed: 0,
            # total: suite.total()
          # }

          # $(this).data("id", suite.id)

          # // runner.run()
          # // run each of the iframes suite independently
          # runner.runSuite(suite, function(){
            # console.log("runSuite finished", arguments, this)
          # });
