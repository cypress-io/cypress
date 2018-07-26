## in all browsers...
##
## activeElement is always programmatically respected and behaves identical whether window is in or out of focus
##
## browser: chrome...
##
## scenario 1: given '#one' is activeElement call programmatic el.focus() on '#two'
## - if window is in focus
##   - blur will fire on '#one'
##   - focus will fire on '#two'
## - if window is out of focus (the event wil be primed until the window receives focus again)
##   - by clicking anywhere on the <body> (not on the element)...
##     - focus on '#two' will fire first
##     - blur on '#one' will fire second
##     - activeElement will now be <body>
##   - by clicking on another element that is focusable
##     - focus on '#two' is first sent
##     - blur on '#two' is then sent
##     - focus is finally sent on the new focusable element we clicked
##   - if instead on clicking we programmatically call .focus() back to '#one'
##     - focus is fired on '#one'
##     - if we were to instead click directly on '#one' then no focus or blur events are fired
##     - if when clicking directly back to '#one' we prevent the 'mousedown' event
##       - the focus event will fire AND the element will still be activeElement
##       - had we not programmatically call .focus() ahead of time, then the focus event would
##         have been not fired, and our activeElement would not have changed
##
## scenario 2 : given '#one' is activeElement call programmatic el.blur() on '#one'
## - if window is in focus
##   - blur will fire on '#one'
## - if window is out of focus
##   - no events will ever fire even when regaining focus
##
## browser: firefox...
##  - no focus events are queued when programmatically calling element.focus() AND the window is out of focus. the events evaporate into the ether.
##  - however, if calling window.focus() programmatically prior to programmatic element.focus() calls will fire all events as if the window is natively in focus

it "sends delayed focus when programmatically invoked during action commands", ->
  cy
  .visit("http://localhost:3500/fixtures/form.html")
  .debug()
  .then ->
    events = []

    expect(cy.getFocused()).to.be.null

    hasFocus = top.document.hasFocus()

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

    cy
    .log('top.document.hasFocus()', hasFocus)
    .then ->
      if hasFocus
        ## if we currently have focus it means
        ## that the browser should fire the
        ## native event immediately
        expect(cy.state("needsForceFocus")).to.be.undefined
        expect(events).to.have.length(1)
        expect(events[0].isTrusted).to.be.true
      else
        expect(cy.state("needsForceFocus")).to.eq($input.get(0))
        expect(events).to.be.empty

        expect(cy.getFocused().get(0)).to.eq($input.get(0))

        cy
        .get("input:first").click()
        .then ->
          expect(cy.getFocused().get(0)).to.eq($input.get(0))

          cy
          .log('top.document.hasFocus()', hasFocus)
          .then ->
            if hasFocus
              ## if we had focus then no additional
              ## focus event is necessary
              expect(events).to.have.length(1)
              expect(events[0].isTrusted).to.be.true
            else
              expect(cy.state("needsForceFocus")).to.be.null

              ## we polyfill the focus event manually
              expect(events).to.have.length(1)
              expect(events[0].isTrusted).to.be.false

it 'opens the dropdown by force firing focus events', ->
  cy
  .visit('http://jedwatson.github.io/react-select/')
  .then ->
    hasFocus = top.document.hasFocus()
    cy
    .log('top.document.hasFocus()', hasFocus)

    cy
      .get('#state-select')
      .get('div.Select-value:first')
      .click()
      .get('.Select-option:contains(Victoria)')
      .click()
