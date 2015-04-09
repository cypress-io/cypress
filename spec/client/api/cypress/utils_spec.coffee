describe "$Cypress.Utils API", ->
  enterCommandTestingMode()

  describe "#hasElement", ->
    it "is true on jQuery objects", ->
      body = @cy.$("body")
      expect($Cypress.Utils.hasElement(body)).to.be.true

    it "is true on DOM objects", ->
      body = @cy.$("body").get(0)
      expect($Cypress.Utils.hasElement(body)).to.be.true

    _.each [{}, [], [{}], 1, "", true], (value) ->
      it "is false on: #{typeof value}", ->
        expect($Cypress.Utils.hasElement(value)).to.be.false

  describe "#stringifyElement", ->
    context "long form", ->
      it "includes wraps element in gt/ls", ->
        input = $("<input />")
        @cy.$("body").append(input)

        str = $Cypress.Utils.stringifyElement(input)
        expect(str).to.eq "<input>"

    context "short form", ->
      it "returns element", ->
        body = @cy.$("body")

        str = $Cypress.Utils.stringifyElement(body, "short")
        expect(str).to.eq "<body>"

      it "returns element + id", ->
        div = $("<div id='id' />")
        @cy.$("body").append(div)

        str = $Cypress.Utils.stringifyElement(div, "short")
        expect(str).to.eq "<div#id>"

      it "uses element class", ->
        div = $("<div class='class foo bar' />")
        @cy.$("body").append(div)

        str = $Cypress.Utils.stringifyElement(div, "short")
        expect(str).to.eq "<div.class.foo.bar>"

      it "uses name, id, and class", ->
        div = $("<div id='baz' class='foo' />")
        @cy.$("body").append(div)

        str = $Cypress.Utils.stringifyElement(div, "short")
        expect(str).to.eq "<div#baz.foo>"

    context "#convertHtmlTags", ->
      it "converts opening brackets to tags", ->
        html = $Cypress.Utils.convertHtmlTags "[strong]foo"
        expect(html).to.eq "<strong>foo"

      it "converts closing brackets to tags", ->
        html = $Cypress.Utils.convertHtmlTags "foo[/strong]"
        expect(html).to.eq "foo</strong>"

      it "converts opening brackets with attrs", ->
        html = $Cypress.Utils.convertHtmlTags "[i class='fa-circle']foo"
        expect(html).to.eq "<i class='fa-circle'>foo"

  describe "#plural", ->
