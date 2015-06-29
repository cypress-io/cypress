describe "Iframe Show App", ->
  enterAppTestingMode()

  describe "Show.Controller", ->
    beforeEach ->
      @reporter   = App.request("reporter:entity")
      @config     = App.config = App.request("new:config:entity")
      @Cypress    = @reporter.Cypress

      @setup = =>
        @controller = new App.TestIframeApp.Show.Controller({runner: @reporter})
        @layout     = @controller.layout
        @header     = @layout.headerRegion.currentView

    it "renders without error", ->
      @setup()

    context "layout", ->
      it "calls #resizeViewport on show", ->
        @config.set
          viewportWidth: 800
          viewportHeight: 600

        @setup()

        expect(@layout.ui.size.width()).to.eq 800
        expect(@layout.ui.size.height()).to.eq 600

    context "header", ->
      it "updates url value on url:changed", ->
        @setup()
        @Cypress.trigger "url:changed", "http://localhost:8080/app"
        expect(@header.ui.url).to.have.value("http://localhost:8080/app")

      it "toggles loading class on loading", ->
        @setup()
        @Cypress.trigger "page:loading", true
        expect(@header.ui.url.parent()).to.have.class("loading")
        @Cypress.trigger "page:loading", false
        expect(@header.ui.url.parent()).not.to.have.class("loading")

      it "initially displays width, height, scale", ->
        @config.set
          viewportWidth: 1024
          viewportHeight: 768

        @setup()

        expect(@header.ui.width).to.have.text("1024")
        expect(@header.ui.height).to.have.text("768")
        expect(@header.ui.scale).to.have.text("100")

      it "updates width, height, scale on model change", ->
        @config.set
          viewportWidth: 1024
          viewportHeight: 768

        @setup()

        @Cypress.trigger "viewport", {width: 800, height: 600}

        expect(@header.ui.width).to.have.text("800")
        expect(@header.ui.height).to.have.text("600")
        expect(@header.ui.scale).to.have.text("100")