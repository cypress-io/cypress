$ = Cypress.$.bind(Cypress)

normalizeStyles = (styles) ->
  styles
  .replace(/\s+/gm, "")
  .replace(/['"]/gm, "'")

describe "src/cy/snapshot", ->
  context "invalid snapshot html", ->
    beforeEach ->
      cy.visit("/fixtures/invalid_html.html")

    it "can spapshot html with invalid attributes", ->
      { htmlAttrs } = cy.createSnapshot()

      expect(htmlAttrs).to.eql({
        foo: "bar"
      })

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

      { body } = cy.createSnapshot(@$el)
      expect(body.find("script")).not.to.exist

    it "does not clone css stylesheets", ->
      $("<link rel='stylesheet' />").appendTo(cy.$$("body"))

      { body } = cy.createSnapshot(@$el)
      expect(body.find("link")).not.to.exist

    it "does not clone style tags", ->
      $("<style>.foo { color: blue }</style>").appendTo(cy.$$("body"))

      { body } = cy.createSnapshot(@$el)
      expect(body.find("style")).not.to.exist

    it "preserves classes on the <html> tag", ->
      $html = cy.$$("html")
      $html.addClass("foo bar")
      $html[0].id = "baz"
      $html.css("margin", "10px")

      { htmlAttrs } = cy.createSnapshot(@$el)
      expect(htmlAttrs).to.eql({
        class: "foo bar"
        id: "baz"
        style: "margin: 10px;"
      })

    it "provides contents of style tags in head", ->
      $("<style>.foo { color: red }</style>").appendTo(cy.$$("head"))

      { headStyles } = cy.createSnapshot(@$el)
      expect(headStyles[0]).to.include(".foo { color: red; }")

    it "provides contents of style tags in head for injected rules", ->
      styleEl = document.createElement("style");
      $(styleEl).appendTo(cy.$$("head"))
      styleEl.sheet.insertRule(".foo { color: red; }", 0)

      { headStyles } = cy.createSnapshot(@$el)
      expect(headStyles[0]).to.include(".foo { color: red; }")

    it "provides contents of local stylesheet links in head", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles[0]).to.include(".foo { color: green; }")
        done()

      $("<link rel='stylesheet' href='generic_styles.css' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "provides media-less stylesheets", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles[0]).to.include(".foo { color: green; }")
        done()

      $("<link rel='stylesheet' href='generic_styles.css' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "provides media=screen stylesheets", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles[0]).to.include(".foo { color: green; }")
        done()

      $("<link rel='stylesheet' href='generic_styles.css' media='screen' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "provides media=all stylesheets", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles[0]).to.include(".foo { color: green; }")
        done()

      $("<link rel='stylesheet' href='generic_styles.css' media='all' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "does not provide non-screen stylesheets", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles).to.have.length(0)
        done()

      $("<link rel='stylesheet' href='generic_styles.css' media='print' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "provides object with href of external stylesheets in head", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        { headStyles } = cy.createSnapshot(@$el)

        expect(headStyles[0]).to.deep.eq({href: "http://localhost:3501/fixtures/generic_styles.css"})
        done()

      $("<link rel='stylesheet' href='http://localhost:3501/fixtures/generic_styles.css' />")
      .load(onLoad)
      .appendTo(cy.$$("head"))

    it "provides contents of style tags in body", ->
      $("<style>.foo { color: red }</style>").appendTo(cy.$$("body"))

      {bodyStyles} = cy.createSnapshot(@$el)
      expect(bodyStyles[bodyStyles.length - 1]).to.include(".foo { color: red; }")

    it "provides contents of local stylesheet links in body", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        {bodyStyles} = cy.createSnapshot(@$el)
        expect(bodyStyles[bodyStyles.length - 1]).to.include(".foo { color: green; }")
        done()

      $("<link rel='stylesheet' href='generic_styles.css' />")
      .load(onLoad)
      .appendTo(cy.$$("body"))

    it "provides object with href of external stylesheets in body", (done) ->
      onLoad = ->
        ## need to for appended stylesheet to load
        {bodyStyles} = cy.createSnapshot(@$el)
        expect(bodyStyles[bodyStyles.length - 1]).to.eql({href: "http://localhost:3501/fixtures/generic_styles.css"})
        done()

      $("<link rel='stylesheet' href='http://localhost:3501/fixtures/generic_styles.css' />")
      .load(onLoad)
      .appendTo(cy.$$("body"))

    it "sets data-cypress-el attr", ->
      attr = cy.spy(@$el, "attr")
      cy.createSnapshot(@$el)
      expect(attr).to.be.calledWith("data-cypress-el", true)

    it "removes data-cypress-el attr", ->
      cy.createSnapshot(@$el)
      expect(@$el.attr("data-cypress-el")).to.be.undefined

    it "replaces CSS paths of style tags with absolute paths", ->
      styles = """
        <style>
          @font-face {
            font-family: 'Some Font';
            src: url('../fonts/some-font.eot');
            src: url('../fonts/some-font.eot?#iefix') format('embedded-opentype'), url('../fonts/some-font.woff2') format('woff2'), url('../fonts/some-font.woff') format('woff'), url('../fonts/some-font.ttf') format('truetype'), url('../fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        </style>
      """
      $(styles).appendTo(cy.$$("head"))

      ## need to wait a tick for appended stylesheet to take affect
      { headStyles } = cy.createSnapshot(@$el)
      expect(headStyles[0].replace(/\s+/gm, "")).to.include """
        @font-face {
          font-family: "Some Font";
          src: url('http://localhost:3500/fonts/some-font.eot?#iefix') format("embedded-opentype"), url('http://localhost:3500/fonts/some-font.woff2') format("woff2"), url('http://localhost:3500/fonts/some-font.woff') format("woff"), url('http://localhost:3500/fonts/some-font.ttf') format("truetype"), url('http://localhost:3500/fonts/some-font.svg#glyphicons_halflingsregular') format("svg");
        }
      """.replace(/\s+/gm, "")

    it "replaces CSS paths of local stylesheets with absolute paths", (done) ->
      loadFn = ->
        ## need to wait a tick for appended stylesheet to take affect
        { headStyles } = cy.createSnapshot(@$el)
        expect(normalizeStyles(headStyles[0])).to.include(normalizeStyles("""
          @font-face {
            font-family: 'Some Font';
            src: url('http://localhost:3500/fixtures/fonts/some-font.eot?#iefix') format('embedded-opentype'), url('http://localhost:3500/fixtures/fonts/some-font.woff2') format('woff2'), url('http://localhost:3500/fixtures/fonts/some-font.woff') format('woff'), url('http://localhost:3500/fixtures/fonts/some-font.ttf') format('truetype'), url('http://localhost:3500/fixtures/fonts/some-font.svg#glyphicons_halflingsregular') format('svg');
          }
        """))
        done()

      $("<link rel='stylesheet' href='nested/with_paths.css' />")
      .load(loadFn)
      .appendTo(cy.$$("head"))

    context "iframes", ->
      it "replaces with placeholders that have src in content", ->
        $("<iframe src='generic.html' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe").length).to.equal(1)
        expect(body.find("iframe")[0].src).to.include("generic.html")

      it "placeholders have same id", ->
        $("<iframe id='foo-bar' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe")[0].id).to.equal("foo-bar")

      it "placeholders have same classes", ->
        $("<iframe class='foo bar' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe")[0].className).to.equal("foo bar")

      it "placeholders have inline styles", ->
        $("<iframe style='margin: 40px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe").css("margin")).to.equal("40px")

      it "placeholders have width set to outer width", ->
        $("<iframe style='width: 40px; padding: 20px; border: solid 5px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe").css("width")).to.equal("90px")

      it "placeholders have height set to outer height", ->
        $("<iframe style='height: 40px; padding: 10px; border: solid 5px' />").appendTo(cy.$$("body"))

        { body } = cy.createSnapshot(@$el)
        expect(body.find("iframe").css("height")).to.equal("70px")
