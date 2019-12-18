$ = Cypress.$.bind(Cypress)
$Snapshots = require("../../../../src/cy/snapshots")

describe "driver/src/cy/snapshots", ->
  context "invalid snapshot html", ->
    beforeEach ->
      cy.visit("/fixtures/invalid_html.html")

    it "can snapshot html with invalid attributes", ->
      { htmlAttrs } = cy.createSnapshot()

      expect(htmlAttrs).to.eql({
        foo: "bar"
      })

  context "snapshot no html/doc", ->
    beforeEach ->
      cy.visit("/fixtures/no_html.html")

    it "does not err on snapshot", ->
      { htmlAttrs } = cy.createSnapshot()

      doc = cy.state("document")
      doc.write('')

      expect(htmlAttrs).to.eql({})

  context "snapshot el", ->
    before ->
      cy
        .visit("/fixtures/generic.html")
        .then (win) ->
          h = $(win.document.head)
          h.find("script").remove()

          @head = h.prop("outerHTML")
          @body = win.document.body.outerHTML

    beforeEach ->
      doc = cy.state("document")


      $(doc.head).empty().html(@head)
      $(doc.body).empty().html(@body)

      @$el = $("<span id='snapshot'>snapshot</span>").appendTo cy.$$("body")

    it "does not clone scripts", ->
      $("<script type='text/javascript' />").appendTo(cy.$$("body"))

      { body } = cy.createSnapshot(null, @$el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      $("<link rel='stylesheet' />").appendTo(cy.$$("body"))

      { body } = cy.createSnapshot(null, @$el)
      expect(body.find("link")).not.to.exist

    it "does not clone style tags", ->
      $("<style>.foo { color: blue }</style>").appendTo(cy.$$("body"))

      { body } = cy.createSnapshot(null, @$el)
      expect(body.find("style")).not.to.exist

    it "preserves classes on the <html> tag", ->
      $html = cy.$$("html")
      $html.addClass("foo bar")
      $html[0].id = "baz"
      $html.css("margin", "10px")

      { htmlAttrs } = cy.createSnapshot(null, @$el)
      expect(htmlAttrs).to.eql({
        class: "foo bar"
        id: "baz"
        style: "margin: 10px;"
      })

    it "sets data-cypress-el attr", ->
      attr = cy.spy(@$el, "attr")
      cy.createSnapshot(null, @$el)
      expect(attr).to.be.calledWith("data-cypress-el", true)

    it "removes data-cypress-el attr", ->
      cy.createSnapshot(null, @$el)
      expect(@$el.attr("data-cypress-el")).to.be.undefined

    context "iframes", ->
      it "replaces with placeholders that have src in content", ->
        $("<iframe src='generic.html' />").appendTo(cy.$$("body"))

        ## NOTE: possibly switch to visual screenshot diffing in future
        ## since data: iframes are considered cross-origin and we cannot
        ## query into them and assert on contents
        ## e.g. cy.get('iframe').toMatchScreenshot()

        ## For now we parse the src attr and assert on base64 encoded content
        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe").length).to.equal(1)
        expect(body.find("iframe")[0].src).to.include(";base64")

        expect(atob(body.find("iframe")[0].src.split(',')[1])).to.include("generic.html")

      it "placeholders have same id", ->
        $("<iframe id='foo-bar' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe")[0].id).to.equal("foo-bar")

      it "placeholders have same classes", ->
        $("<iframe class='foo bar' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe")[0].className).to.equal("foo bar")

      it "placeholders have inline styles", ->
        $("<iframe style='margin: 40px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe").css("margin")).to.equal("40px")

      it "placeholders have width set to outer width", ->
        $("<iframe style='width: 40px; padding: 20px; border: solid 5px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe").css("width")).to.equal("90px")

      it "placeholders have height set to outer height", ->
        $("<iframe style='height: 40px; padding: 10px; border: solid 5px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(null, @$el)
        expect(body.find("iframe").css("height")).to.equal("70px")
