describe "Iframe Show App", ->
  enterAppTestingMode()

  beforeEach ->
    @runner   = App.request("runner:entity")
    @config   = App.config = App.request("new:config:entity")
    @iframe   = @runner.iframe
    @Cypress  = @runner.Cypress

    @setup = =>
      @sandbox.stub(App.TestIframeApp.Show.Layout.prototype, "calcWidth")

      @controller = new App.TestIframeApp.Show.Controller({iframe: @iframe})
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

    ## invoke Cypress viewport and then to reload
    ## the iframe and ensure the dimensions are reset again

    it "calls #calcWidth on show", ->
      @setup()
      expect(App.TestIframeApp.Show.Layout::calcWidth).to.be.calledOnce

    describe "#calcScale", ->
      beforeEach ->
        @setup()

      it "sets scale to 1 when width + height are > iframe", ->
        @layout.calcScale(10000, 1000)
        expect(@iframe.attributes.viewportScale).to.eq 1
        expect(@iframe.get("viewportScale")).to.eq "100"

      it "reduces width scale proportionally", ->
        css = @sandbox.spy @layout.ui.size, "css"

        @layout.ui.size.width(500)
        @layout.ui.size.height(500)
        @layout.calcScale(400, 400)

        expect(@iframe.attributes.viewportScale).to.eq "0.8000"
        expect(@iframe.get("viewportScale")).to.eq "80"

        expect(css).to.be.calledWith {transform: "scale(0.8000)"}

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