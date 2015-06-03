describe "Element Dimensions Utility", ->
  enterCommandTestingMode("html/dimensions")

  context "dimensions", ->
    beforeEach ->
      @loadDom("html/dimensions").then =>
        @setup({replaceIframeContents: false})
        @Cypress.set @currentTest

    context "square", ->
      beforeEach ->
        @square      = @cy.$("#square")
        @dimensions  = App.request "element:dimensions", @square

      it "returns an object containing dimensions", ->
        expect(@dimensions).to.be.an "object"

      it "sets height to 20", ->
        expect(@dimensions).to.have.property "height", 20

      it "sets width to 20", ->
        expect(@dimensions).to.have.property "width", 20

    context "square with padding", ->
      beforeEach ->
        @square      = @cy.$("#square-padding")
        @dimensions  = App.request "element:dimensions", @square

      it "sets height to 20", ->
        expect(@dimensions).to.have.property "height", 20

      it "sets width to 20", ->
        expect(@dimensions).to.have.property "width", 20

      it "sets paddingTop to 5", ->
        expect(@dimensions).to.have.property "paddingTop", 5

      it "sets paddingRight to 10", ->
        expect(@dimensions).to.have.property "paddingRight", 10

      it "sets paddingBottom to 5", ->
        expect(@dimensions).to.have.property "paddingBottom", 5

      it "sets paddingLeft to 10", ->
        expect(@dimensions).to.have.property "paddingLeft", 10

      it "sets heightWithPadding to 30", ->
        expect(@dimensions).to.have.property "heightWithPadding", 30

      it "sets widthWithPadding to 40", ->
        expect(@dimensions).to.have.property "widthWithPadding", 40

      it "layers padding div", ->
        @layer = App.request "element:box:model:layers", @square, @cy.$("body")
        style = @layer.find("[data-layer='Padding']").prop("style")
        expect(style).to.have.property("height", "30px")
        expect(style).to.have.property("width", "40px")

    context "square with border", ->
      beforeEach ->
        @square      = @cy.$("#square-border")
        @dimensions  = App.request "element:dimensions", @square

      it "sets height to 20", ->
        expect(@dimensions).to.have.property "height", 20

      it "sets width to 20", ->
        expect(@dimensions).to.have.property "width", 20

      it "sets borderTop to 2", ->
        expect(@dimensions).to.have.property "borderTop", 2

      it "sets borderRight to 2", ->
        expect(@dimensions).to.have.property "borderRight", 2

      it "sets borderBottom to 2", ->
        expect(@dimensions).to.have.property "borderBottom", 2

      it "sets borderLeft to 2", ->
        expect(@dimensions).to.have.property "borderLeft", 2

      it "sets heightWithBorder to 24", ->
        expect(@dimensions).to.have.property "heightWithBorder", 24

      it "sets widthWithBorder to 24", ->
        expect(@dimensions).to.have.property "widthWithBorder", 24

      it "layers border div", ->
        @layer = App.request "element:box:model:layers", @square, @cy.$("body")
        style = @layer.find("[data-layer='Border']").prop("style")
        expect(style).to.have.property("height", "24px")
        expect(style).to.have.property("width", "24px")

    context "square with margin", ->
      beforeEach ->
        @square      = @cy.$("#square-margin")
        @dimensions  = App.request "element:dimensions", @square

      it "sets height to 20", ->
        expect(@dimensions).to.have.property "height", 20

      it "sets width to 20", ->
        expect(@dimensions).to.have.property "width", 20

      it "sets marginTop to 8", ->
        expect(@dimensions).to.have.property "marginTop", 8

      it "sets marginRight to 6", ->
        expect(@dimensions).to.have.property "marginRight", 6

      it "sets marginBottom to 8", ->
        expect(@dimensions).to.have.property "marginBottom", 8

      it "sets marginLeft to 6", ->
        expect(@dimensions).to.have.property "marginLeft", 6

      it "sets heightWithMargin to 36", ->
        expect(@dimensions).to.have.property "heightWithMargin", 36

      it "sets widthWithMargin to 32", ->
        expect(@dimensions).to.have.property "widthWithMargin", 32

      it "layers margin div", ->
        @layer = App.request "element:box:model:layers", @square, @cy.$("body")
        style = @layer.find("[data-layer='Margin']").prop("style")
        expect(style).to.have.property("height", "36px")
        expect(style).to.have.property("width", "32px")

    context "square with margin, border, padding", ->
      beforeEach ->
        @square      = @cy.$("#square-margin-border-padding")

      it "layers content div", ->
        @layer = App.request "element:box:model:layers", @square, @cy.$("body")
        style = @layer.find("[data-layer='Content']").prop("style")
        expect(style).to.have.property("height", "20px")
        expect(style).to.have.property("width", "20px")

    context "negative margin, padding", ->
      beforeEach ->
        @square = @cy.$("#square-negative-margin-padding")

      it "does not throw on negative margins or negative padding", ->
        fn = => App.request("element:dimensions", @square)
        expect(fn).not.to.throw(Error)

    context "rectangle rotated 90deg", ->
      beforeEach ->
        @rect = @cy.$("#rect-rotated")

      it "layers rotation correctly", ->
        @layer = App.request "element:box:model:layers", @rect, @cy.$("body")
        # expect(@layer.children().offset()).to.deep.eq @rect.offset()

        @layer.children().each (index, el) ->
          $el = $(el)
          expect($el.offset()).to.deep.eq {
            top: $el.data("top")
            left: $el.data("left")
          }