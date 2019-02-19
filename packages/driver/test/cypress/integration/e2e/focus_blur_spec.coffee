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
        configurable: true
        get: ->
          return $one.get(0)
      })

      ## change the focus to two, which first fires
      ## the blur event on $one, followed by a focus
      ## event on $two
      $two.get(0).focus()

      Object.defineProperty(cy.state('document'), 'activeElement', {
        configurable: true
        get: ->
          return $two.get(0)
      })

      expect(events).to.have.length(3)

      ## call focus programmically again on the same
      ## element, whichshould replicate the native browser's
      ## behavior and NOT fire another focus event because this
      ## element is already currently in focus / activeElement
      $two.get(0).focus()

      expect(events).to.have.length(3)

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

      $body = cy.$$("body")
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
        configurable: true
        get: ->
          return $one.get(0)
      })

      $one.get(0).blur()

      ## force the browser to return body
      Object.defineProperty(cy.state('document'), 'activeElement', {
        get: ->
          return $body.get(0)
      })

      ## call blur programmically again, which
      ## should replicate the native browser's behavior
      ## and NOT fire another blur event because this
      ## element is NOT currently in focus / activeElement
      $one.get(0).blur()

      expect(events).to.have.length(2)

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
