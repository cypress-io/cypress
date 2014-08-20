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

      @highlight(dom, options.el) if options.highlight

    addRevertMessage: (options) ->
      @ui.message.text("DOM has been reverted").show()

    getZIndex: (el) ->
      if /^(auto|0)$/.test el.css("zIndex") then 1000 else Number el.css("zIndex")

    highlight: (dom, el) ->
      el = dom.find(el.selector)
      dimensions = @getDimensions(el)

      $("<div>")
        .appendTo(dom)
          .css
            width: dimensions.width - 6,
            height: dimensions.height - 6,
            top: dimensions.offset.top,
            left: dimensions.offset.left,
            position: "absolute",
            zIndex: @getZIndex(el)
            border: "3px solid #E94B3B"

    getDimensions: (el) ->
      {
        offset: el.offset()
        width: el.outerWidth(false)
        height: el.outerHeight(false)
      }

    onShow: ->
      # @ui.header.hide()
      @ui.compress.hide()

    loadIframe: (src, fn) ->
      ## remove any existing iframes
      @ui.message.hide().empty()
      @$el.find("iframe").remove()

      @$el.hide()

      view = @

      @src = "/iframes/" + src
      @fn = fn

      iframe = $ "<iframe />",
        src: @src
        class: "iframe-spec"
        load: ->
          console.info("loaded!", iframe, @contentWindow);
          fn(@contentWindow)
          view.$el.show()
          # view.ui.header.show()

      iframe.appendTo(@$el)

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
