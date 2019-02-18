$ = Cypress.$.bind(Cypress)

describe "src/dom/elements", ->
  context ".isAttached", ->
    beforeEach ->
      cy.visit("/fixtures/iframe-outer.html")

    it "no elements", ->
      $el = $(null)

      expect(Cypress.dom.isAttached($el)).to.be.false

    it "element", ->
      cy.get("span").then ($span) ->
        expect(Cypress.dom.isAttached($span)).to.be.true

        $span.remove()

        expect(Cypress.dom.isAttached($span)).to.be.false

    it "stale element", (done) ->
      cy.get("span").then ($span) ->
        expect(Cypress.dom.isAttached($span)).to.be.true

        cy.on "page:ready", ->
          expect(Cypress.dom.isAttached($span)).to.be.false
          done()

        cy.window().then (win) ->
          win.location.reload()

    it "window", ->
      cy.window().then (win) ->
        ## windows are always considered attached since
        ## their references will be replaced anyway with
        ## new windows
        expect(Cypress.dom.isAttached(win)).to.be.true

    it "document", (done) ->
      cy.document().then (doc) ->
        ## documents are considered attached only if
        ## they have a defaultView (window) which will
        ## be null when the documents are stale
        expect(Cypress.dom.isAttached(doc)).to.be.true

        cy.on "page:ready", ->
          expect(Cypress.dom.isAttached(doc)).to.be.false
          done()

        cy.window().then (win) ->
          win.location.reload()

    it "element in iframe", (done) ->
      cy.get("iframe").then ($iframe) ->
        $doc = $iframe.contents()

        $btn = $doc.find("button")

        expect($btn.length).to.eq(1)

        expect(Cypress.dom.isAttached($btn)).to.be.true

        ## when the iframe is reloaded
        $iframe.on "load", ->
          ## the element should be stale now
          expect(Cypress.dom.isAttached($btn)).to.be.false
          done()

        win = $doc.get(0).defaultView

        win.location.reload()

  context ".isDetached", ->
    it "opposite of attached", ->
      $el = $(null)

      expect(Cypress.dom.isDetached($el)).to.be.true

  context ".isType", ->
    beforeEach ->
      cy.visit("/fixtures/dom.html")

    it "when type is a string", ->
      $el = $('input[type="number"]')

      expect(Cypress.dom.isType($el, 'number')).to.be.true
      expect(Cypress.dom.isType($el, 'text')).to.be.false

    it "when type is an array", ->
      $el = $('input[type="number"]')

      expect(Cypress.dom.isType($el, ['number', 'text', 'email'])).to.be.true
      expect(Cypress.dom.isType($el, ['text', 'email'])).to.be.false
