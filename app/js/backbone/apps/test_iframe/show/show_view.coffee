@App.module "TestIframeApp.Show", (Show, App, Backbone, Marionette, $, _) ->

  class Show.Iframe extends App.Views.ItemView
    template: "test_iframe/show/iframe"

    loadIframe: (src, fn) ->
      console.warn "loading iframe", src
      iframe = $ "<iframe />",
        src: "/iframes/" + src
        class: "iframe-spec",
        load: ->
          console.info("loaded!", iframe, @contentWindow);
          fn(@contentWindow)

      iframe.appendTo(@$el)


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
