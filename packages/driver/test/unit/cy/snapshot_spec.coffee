{ $ } = window.testUtils

normalizeStyles = (styles) ->
  styles
  .replace(/\s+/gm, "")
  .replace(/['"]/gm, "'")

describe "$Cypress.Cy Snapshot Extension", ->
  enterCommandTestingMode()

  context "invalid snapshot html", ->
    beforeEach ->
      @loadDom("invalid_html").then =>
        @setup({replaceIframeContents: false})
        @Cypress.set @currentTest

    it "can spapshot html with invalid attributes", ->
      {htmlAttrs} = @Cypress.createSnapshot(@el)

      expect(htmlAttrs).to.eql({
        foo: "bar"
      })

  context "snapshot el", ->
    beforeEach ->
      @el = $("<span id='snapshot'>snapshot</span>").appendTo @cy.$$("body")

    it "does not clone scripts", ->
      $("<script type='text/javascript' />").appendTo(@cy.$$("body"))

      {body} = @Cypress.createSnapshot(@el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      $("<link rel='stylesheet' />").appendTo(@cy.$$("body"))

      {body} = @Cypress.createSnapshot(@el)
      expect(body.find("link")).not.to.exist

    it "does not clone style tags", ->
      $("<style>.foo { color: blue }</style>").appendTo(@cy.$$("body"))

      {body} = @Cypress.createSnapshot(@el)
      expect(body.find("style")).not.to.exist

    it "preserves classes on the <html> tag", ->
      $html = @cy.$$("html")
      $html.addClass("foo bar")
      $html[0].id = "baz"
      $html.css("margin", "10px")

      {htmlAttrs} = @Cypress.createSnapshot(@el)
      expect(htmlAttrs).to.eql({
        class: "foo bar"
        id: "baz"
        style: "margin: 10px;"
      })

    it "provides contents of style tags in head", ->
      $("<style>.foo { color: red }</style>").appendTo(@cy.$$("head"))

      {headStyles} = @Cypress.createSnapshot(@el)
      expect(headStyles[0]).to.include(".foo { color: red }")

    it "provides contents of local stylesheet links in head", (done) ->
      $("<link rel='stylesheet' href='generic_styles.css' />").appendTo(@cy.$$("head"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {headStyles} = @Cypress.createSnapshot(@el)
        expect(headStyles[0]).to.include(".foo { color: green; }")
        done()

    it "provides object with href of external stylesheets in head", (done) ->
      $("<link rel='stylesheet' href='http://localhost:3501/fixtures/generic_styles.css' />").appendTo(@cy.$$("head"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {headStyles} = @Cypress.createSnapshot(@el)
        expect(headStyles[0]).to.eql({href: "http://localhost:3501/fixtures/generic_styles.css"})
        done()

    it "provides contents of style tags in body", ->
      $("<style>.foo { color: red }</style>").appendTo(@cy.$$("body"))

      {bodyStyles} = @Cypress.createSnapshot(@el)
      expect(bodyStyles[bodyStyles.length - 1]).to.include(".foo { color: red }")

    it "provides contents of local stylesheet links in body", (done) ->
      $("<link rel='stylesheet' href='generic_styles.css' />").appendTo(@cy.$$("body"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {bodyStyles} = @Cypress.createSnapshot(@el)
        expect(bodyStyles[bodyStyles.length - 1]).to.include(".foo { color: green; }")
        done()

    it "provides object with href of external stylesheets in body", (done) ->
      $("<link rel='stylesheet' href='http://localhost:3501/fixtures/generic_styles.css' />").appendTo(@cy.$$("body"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {bodyStyles} = @Cypress.createSnapshot(@el)
        expect(bodyStyles[bodyStyles.length - 1]).to.eql({href: "http://localhost:3501/fixtures/generic_styles.css"})
        done()

    it "sets data-cypress-el attr", ->
      attr = @sandbox.spy @el, "attr"
      @Cypress.createSnapshot(@el)
      expect(attr).to.be.calledWith "data-cypress-el", true

    it "removes data-cypress-el attr", ->
      @Cypress.createSnapshot(@el)
      expect(@el.attr("data-cypress-el")).to.be.undefined

    it "replaces CSS paths of style tags with absolute paths", (done) ->
      styles = """
        <style>
          @font-face {
            font-family: 'Some Font';
            src: url('../fonts/some-font.eot');
            src: url('../fonts/some-font.eot?#iefix') format('embedded-opentype'), url('../fonts/some-font.woff2') format('woff2'), url('../fonts/some-font.woff') format('woff'), url('../fonts/some-font.ttf') format('truetype'), url('../fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        </style>
      """
      $(styles).appendTo(@cy.$$("head"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {headStyles} = @Cypress.createSnapshot(@el)
        expect(headStyles[0].replace(/\s+/gm, "")).to.include """
          @font-face {
            font-family: 'Some Font';
            src: url('http://localhost:3500/fonts/some-font.eot');
            src: url('http://localhost:3500/fonts/some-font.eot?#iefix') format('embedded-opentype'), url('http://localhost:3500/fonts/some-font.woff2') format('woff2'), url('http://localhost:3500/fonts/some-font.woff') format('woff'), url('http://localhost:3500/fonts/some-font.ttf') format('truetype'), url('http://localhost:3500/fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        """.replace(/\s+/gm, "")
        done()

    it "replaces CSS paths of local stylesheets with absolute paths", (done) ->
      $("<link rel='stylesheet' href='nested/with_paths.css' />").appendTo(@cy.$$("head"))

      setTimeout ->
        ## need to wait a tick for appended stylesheet to take affect
        {headStyles} = @Cypress.createSnapshot(@el)
        expect(normalizeStyles(headStyles[0])).to.include(normalizeStyles("""
          @font-face {
            font-family: 'Some Font';
            src: url('http://localhost:3500/fixtures/fonts/some-font.eot?#iefix') format('embedded-opentype'), url('http://localhost:3500/fixtures/fonts/some-font.woff2') format('woff2'), url('http://localhost:3500/fixtures/fonts/some-font.woff') format('woff'), url('http://localhost:3500/fixtures/fonts/some-font.ttf') format('truetype'), url('http://localhost:3500/fixtures/fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        """))
        done()

    context "iframes", ->

      it "replaces with placeholders that have src in content", ->
        $("<iframe src='generic.html' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").length).to.equal(1)
        expect(body.find("iframe")[0].src).to.include("generic.html")

      it "placeholders have same id", ->
        $("<iframe id='foo-bar' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe")[0].id).to.equal("foo-bar")

      it "placeholders have same classes", ->
        $("<iframe class='foo bar' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe")[0].className).to.equal("foo bar")

      it "placeholders have inline styles", ->
        $("<iframe style='margin: 40px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("margin")).to.equal("40px")

      it "placeholders have width set to outer width", ->
        $("<iframe style='width: 40px; padding: 20px; border: solid 5px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("width")).to.equal("90px")

      it "placeholders have height set to outer height", ->
        $("<iframe style='height: 40px; padding: 10px; border: solid 5px' />").appendTo(@cy.$$("body"))

        {body} = @Cypress.createSnapshot(@el)
        expect(body.find("iframe").css("height")).to.equal("70px")
