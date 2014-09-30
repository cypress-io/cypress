describe "Element Dimensions Utility", ->
  before ->
    loadFixture("html/dimensions").done =>
      @html = $("iframe:first").contents()

  context "square", ->
    beforeEach ->
      @square      = @html.find("#square")
      @dimensions  = App.request "element:dimensions", @square

    it "returns an object containing dimensions", ->
      expect(@dimensions).to.be.an "object"

    it "sets height to 20", ->
      expect(@dimensions).to.have.property "height", 20

    it "sets width to 20", ->
      expect(@dimensions).to.have.property "width", 20

  context "square with padding", ->
    beforeEach ->
      @square      = @html.find("#square-padding")
      @dimensions  = App.request "element:dimensions", @square

    it "sets height to 20", ->
      expect(@dimensions).to.have.property "height", 20

    it "sets width to 20", ->
      expect(@dimensions).to.have.property "width", 20

    it "sets padding-top to 5", ->
      expect(@dimensions).to.have.property "paddingTop", 5

    it "sets padding-right to 10", ->
      expect(@dimensions).to.have.property "paddingRight", 10

    it "sets padding-bottom to 5", ->
      expect(@dimensions).to.have.property "paddingBottom", 5

    it "sets padding-left to 10", ->
      expect(@dimensions).to.have.property "paddingLeft", 10

    it "setsHeightWithPadding to 30", ->
      expect(@dimensions).to.have.property "heightWithPadding", 30

    describe "layering inspector divs", ->
      before ->
        @layer = App.request "element:box:model:layers", @square, @html.find("body")

      it "layers height + margin div", ->

  context "square with border", ->
    beforeEach ->
      @square      = @html.find("#square-border")
      @dimensions  = App.request "element:dimensions", @square

    it "sets height to 20", ->
      expect(@dimensions).to.have.property "height", 20

    it "sets width to 20", ->
      expect(@dimensions).to.have.property "width", 20

    it "sets border-top to 2", ->
      expect(@dimensions).to.have.property "borderTop", 2

    it "sets border-right to 2", ->
      expect(@dimensions).to.have.property "borderRight", 2

    it "sets border-bottom to 2", ->
      expect(@dimensions).to.have.property "borderBottom", 2

    it "sets border-left to 2", ->
      expect(@dimensions).to.have.property "borderLeft", 2

  context "square with margin", ->
    beforeEach ->
      @square      = @html.find("#square-margin")
      @dimensions  = App.request "element:dimensions", @square

    it "sets height to 20", ->
      expect(@dimensions).to.have.property "height", 20

    it "sets width to 20", ->
      expect(@dimensions).to.have.property "width", 20

    it "sets margin-top to 8", ->
      expect(@dimensions).to.have.property "marginTop", 8

    it "sets margin-right to 6", ->
      expect(@dimensions).to.have.property "marginRight", 6

    it "sets margin-bottom to 8", ->
      expect(@dimensions).to.have.property "marginBottom", 8

    it "sets margin-left to 6", ->
      expect(@dimensions).to.have.property "marginLeft", 6

    describe "layering inspector divs", ->
      before ->
        @layer = App.request "element:box:model:layers", @square, @html.find("body")

      it "layers height + margin div", ->


