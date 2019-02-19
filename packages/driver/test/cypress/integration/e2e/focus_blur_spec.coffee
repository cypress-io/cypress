{ _ } = Cypress

it "blur the activeElement when clicking the body", ->
  cy
  .visit("http://localhost:3500/fixtures/active-elements.html")
  .then ->
    events = []

    expect(cy.getFocused()).to.be.null

    doc = cy.state("document")

    hasFocus = doc.hasFocus()

    $body = cy.$$("body")
    $one = cy.$$("#one")
    $two = cy.$$("#two")

    ## collect the focus + blur events
    ["focus", "blur"].forEach (evt) ->
      $one.on evt, (e) ->
        events.push(e.originalEvent)

      $two.on evt, (e) ->
        events.push(e.originalEvent)

    ## programmatically focus the first, then second input element
    $one.get(0).focus()
    $two.get(0).focus()

    cy
    .log('top.document.hasFocus()', hasFocus)
    .then ->
      ## if we currently have focus it means
      ## that the browser should haved fired
      ## the native event immediately, but if it
      ## was not in focus, we programmatically polyfill
      ## these events in cypress-land to make normalize
      ## as if the browser *is always* in focus
      expect(cy.state("needsForceFocus")).to.be.undefined
      expect(events).to.have.length(3)

      expect(_.toPlainObject(events[0])).to.include({
        type: "focus"
        isTrusted: hasFocus
        target: $one.get(0)
      })

      expect(_.toPlainObject(events[1])).to.include({
        type: "blur"
        isTrusted: hasFocus
        target: $one.get(0)
      })

      expect(_.toPlainObject(events[2])).to.include({
        type: "focus"
        isTrusted: hasFocus
        target: $two.get(0)
      })

    cy
    .get("body").click()
    .then ->
      expect(doc.activeElement).to.eq($body.get(0))

    cy
    .log('top.document.hasFocus()', hasFocus)
    .then ->
      expect(events).to.have.length(4)

      expect(_.toPlainObject(events[3])).to.include({
        type: "blur"
        isTrusted: hasFocus
        target: $two.get(0)
      })

describe 'polyfill programmatic blur events', ->
  ## restore these props for the rest of the tests
  oldFocus = window.top.HTMLElement.prototype.focus
  oldBlur = window.top.HTMLElement.prototype.blur
  oldHasFocus = window.top.document.hasFocus
  oldActiveElement = null
  beforeEach ->
    oldActiveElement = Object.getOwnPropertyDescriptor(window.Document.prototype, 'activeElement')

    ## simulate window being out of focus by overwriting
    ## the focus/blur methods on HTMLElement
    window.top.document.hasFocus = -> false
    window.top.HTMLElement.prototype.focus = ->
    window.top.HTMLElement.prototype.blur = ->

  afterEach ->
    Object.defineProperty(window.Document.prototype, 'activeElement', oldActiveElement)
    window.top.HTMLElement.prototype.focus = oldFocus
    window.top.HTMLElement.prototype.blur = oldBlur
    window.top.document.hasFocus = oldHasFocus

  ## https://github.com/cypress-io/cypress/issues/1486
  it 'simulated events when window is out of focus when .focus called', ->
    cy
    .visit("http://localhost:3500/fixtures/active-elements.html")
    .then ->
      events = []

      $one = cy.$$("#one")
      $two = cy.$$("#two")

      ["focus", "blur"].forEach (evt) ->
        $one.on evt, (e) ->
          events.push(e.originalEvent)

        $two.on evt, (e) ->
          events.push(e.originalEvent)

      ## call focus on the first element
      ## but with the Element.prototype.focus nuked
      ## the browser will act as if its out of focus
      ## which cypress reacts to and handles correctly
      $one.get(0).focus()

      ## a hack here becuase we nuked the real .focus but need
      ## to mimic what the browser does when its out of focus
      Object.defineProperty(cy.state('document'), 'activeElement', {
      get: ->
        return $one.get(0)
      })

      ## change the focus to two, which first fires
      ## the blur event on $one, followed by a focus
      ## event on $two
      $two.get(0).focus()

      cy.log(events).then ->
        expect(_.toPlainObject(events[0])).to.include({
          type: "focus"
          isTrusted: false
          target: $one.get(0)
        })

        expect(_.toPlainObject(events[1])).to.include({
          type: "blur"
          isTrusted: false
          target: $one.get(0)
        })

        expect(_.toPlainObject(events[2])).to.include({
          type: "focus"
          isTrusted: false
          target: $two.get(0)
        })

  ## https://github.com/cypress-io/cypress/issues/1176
  it 'simulated events when window is out of focus when .blur called', ->
    cy
    .visit("http://localhost:3500/fixtures/active-elements.html")
    .then ->
      events = []

      $one = cy.$$("#one")
      $two = cy.$$("#two")

      ["focus", "blur"].forEach (evt) ->
        $one.on evt, (e) ->
          events.push(e.originalEvent)

        $two.on evt, (e) ->
          events.push(e.originalEvent)

      ## call focus on the first element
      ## but with the Element.prototype.focus nuked
      ## the browser will act as if its out of focus
      ## which cypress reacts to and handles correctly
      $one.get(0).focus()

      ## a hack here becuase we nuked the real .focus but need
      ## to mimic what the browser does when its out of focus
      Object.defineProperty(cy.state('document'), 'activeElement', {
        get: ->
          return $one.get(0)
      })
      $one.get(0).blur()


      cy.log(events).then ->

        expect(_.toPlainObject(events[0])).to.include({
          type: "focus"
          isTrusted: false
          target: $one.get(0)
        })

        expect(_.toPlainObject(events[1])).to.include({
          type: "blur"
          isTrusted: false
          target: $one.get(0)
        })

  describe "when cy.state('actAsIfWindowHasFocus') = false", ->
    beforeEach ->
      cy.state('actAsIfWindowHasFocus', false)

    it 'sends delayed blur when programmatically invoked during action commands', ->
      cy
      .visit("http://localhost:3500/fixtures/active-elements.html")
      .then ->
        events = []

        expect(cy.getFocused()).to.be.null

        ## programmatically focus the first input element
        $one = cy.$$("#one")
        $two = cy.$$("#two")

        ["focus", "blur"].forEach (evt) ->
          $one.on evt, (e) ->
            events.push(e.originalEvent)

          $two.on evt, (e) ->
            events.push(e.originalEvent)

        ## when we mousedown on the input
        ## prevent default so that we can test
        ## that the force focus event is set ahead
        ## of time
        $two.on "mousedown", (e) ->
          e.preventDefault()

        $one.get(0).focus()
        Object.defineProperty(cy.state('document'), 'activeElement', {
          get: ->
            return $one.get(0)
          })

        expect(cy.state("needsForceFocus")).to.eq($one.get(0))
        expect(events).to.be.empty

        expect(cy.getFocused().get(0)).to.eq($one.get(0))

        cy
        .get("#one").click()
        .then ->
          expect(cy.state("needsForceFocus")).to.be.null

          ## we polyfill the focus event manually
          expect(events).to.have.length(1)
          expect(events[0].isTrusted).to.be.false


    it "sends delayed focus when programmatically invoked during action commands", ->
      cy
      .visit("http://localhost:3500/fixtures/active-elements.html")
      .then ->
        events = []

        expect(cy.getFocused()).to.be.null

        ## programmatically focus the first input element
        $input = cy.$$("input:first")

        $input.on "focus", (e) ->
          events.push(e.originalEvent)

        ## when we mousedown on the input
        ## prevent default so that we can test
        ## that the force focus event is set ahead
        ## of time
        $input.on "mousedown", (e) ->
          e.preventDefault()

        $input.get(0).focus()
        Object.defineProperty(cy.state('document'), 'activeElement', {
          get: ->
            return $input.get(0)
          })


        expect(cy.state("needsForceFocus")).to.eq($input.get(0))
        expect(events).to.be.empty

        expect(cy.getFocused().get(0)).to.eq($input.get(0))

        cy
        .get("input:first").click().then ->
          expect(cy.state("needsForceFocus")).to.be.null

          ## we polyfill the focus event manually
          expect(events).to.have.length(1)
          expect(events[0].isTrusted).to.be.false

## https://github.com/cypress-io/cypress/issues/3001
describe 'skip actionability if already focused', ->
  it 'inside input', ->
    cy
    .visit("http://localhost:3500/fixtures/active-elements.html")
    .then ->

      cy.$$('body').append(Cypress.$('
      <div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div>
      <input type="text" id="foo">
      '))
      win = cy.state('window')
      doc = window.document
      cy.$$('#foo').focus()
    cy.focused().type('new text').should('have.prop', 'value', 'new text')

  it 'inside textarea', ->
    cy
    .visit("http://localhost:3500/fixtures/active-elements.html")
    .then ->

      cy.$$('body').append(Cypress.$('
      <div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div>
      <textarea id="foo"></textarea>
      '))
      win = cy.state('window')
      doc = window.document
      cy.$$('#foo').focus()
    cy.focused().type('new text').should('have.prop', 'value', 'new text')

  it 'inside contenteditable', ->
    cy
    .visit("http://localhost:3500/fixtures/active-elements.html")
    .then ->

      cy.$$('body').append(Cypress.$('
      <div style="position:relative;width:100%;height:100px;background-color:salmon;top:60px;opacity:0.5"></div>
      <div id="foo" contenteditable>
        <div>foo</div><div>bar</div><div>baz</div>
      </div>
      '))
      win = cy.state('window')
      doc = window.document
      cy.$$('#foo').focus()
      inner = cy.$$('div:contains(bar):last')
      console.log(inner)
      range = doc.createRange()
      range.selectNodeContents(inner[0])
      sel = win.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    cy.get('div:contains(bar):last').type('new text').should('have.prop', 'innerText', 'new text')
