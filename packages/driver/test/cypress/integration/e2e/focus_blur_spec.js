/// <reference path="../../../../../../cli/types/index.d.ts" />
/* eslint arrow-body-style:'off' */

/**
  * in all browsers...
  *
  * activeElement is always programmatically respected and behaves identical whether window is in or out of focus
  *
  * browser: chrome...
  *
  * scenario 1: given '#one' is activeElement call programmatic el.focus() on '#two'
  * - if window is in focus
  *   - blur will fire on '#one'
  *   - focus will fire on '#two'
  * - if window is out of focus (the event wil be primed until the window receives focus again)
  *   - by clicking anywhere on the <body> (not on the element)...
  *     - focus on '#two' will fire first
  *     - blur on '#two' will fire second
  *     - activeElement will now be <body>
  *   - by clicking on another element that is focusable
  *     - focus on '#two' is first sent
  *     - blur on '#two' is then sent
  *     - focus is finally sent on the new focusable element we clicked
  *   - if instead on clicking we programmatically call .focus() back to '#one'
  *     - focus is fired on '#one'
  *     - if we were to instead click directly on '#one' then no focus or blur events are fired
  *     - if when clicking directly back to '#one' we prevent the 'mousedown' event
  *       - the focus event will fire AND the element will still be activeElement
  *       - had we not programmatically call .focus() ahead of time, then the focus event would
  *         have been not fired, and our activeElement would not have changed
  *
  * scenario 2 : given '#one' is activeElement call programmatic el.blur() on '#one'
  * - if window is in focus
  *   - blur will fire on '#one'
  * - if window is out of focus
  *   - no events will ever fire even when regaining focus

  * browser: firefox...
  *   - no focus events are queued when programmatically calling element.focus() AND the window is out of focus. the events evaporate into the ether.
  *   - however, if calling window.focus() programmatically prior to programmatic element.focus() calls will fire all events as if the window is natively in focus
*/
const { _ } = Cypress

const chaiSubset = require('chai-subset')

chai.use(chaiSubset)

const windowHasFocus = () => {
  if (top.document.hasFocus()) return true

  let hasFocus = false

  window.addEventListener('focus', () => {
    hasFocus = true
  })

  window.focus()

  return hasFocus
}

const requireWindowInFocus = () => {
  let hasFocus = windowHasFocus()

  if (!hasFocus) {
    expect(hasFocus, 'this test requires the window to be in focus').ok
  }
}

it('can intercept blur/focus events', () => {
  // Browser must be in focus

  const focus = cy.spy(window.top.HTMLElement.prototype, 'focus')
  const blur = cy.spy(window.top.HTMLElement.prototype, 'blur')

  const handleFocus = cy.stub().as('handleFocus')
  const handleBlur = cy.stub().as('handleBlur')

  const resetStubs = () => {
    focus.resetHistory()
    blur.resetHistory()
    handleFocus.resetHistory()
    handleBlur.resetHistory()
  }

  cy
  .visit('http://localhost:3500/fixtures/active-elements.html')
  .then(() => {
    requireWindowInFocus()

    expect(cy.getFocused()).to.be.null

    // programmatically focus the first, then second input element

    const one = cy.$$('#one')[0]
    const two = cy.$$('#two')[0]

    one.addEventListener('focus', handleFocus)
    two.addEventListener('focus', handleFocus)
    one.addEventListener('blur', handleBlur)
    two.addEventListener('blur', handleBlur)

    one.focus()

    expect(focus).to.calledOnce
    expect(handleFocus).calledOnce
    expect(blur).not.called
    expect(handleBlur).not.called

    resetStubs()

    one.focus()

    expect(focus).to.calledOnce
    expect(handleFocus).not.called
    expect(blur).not.called
    expect(handleBlur).not.called

    resetStubs()

    one.blur()

    expect(blur).calledOnce
    expect(handleBlur).calledOnce

    resetStubs()

    one.blur()

    expect(blur).calledOnce
    expect(handleBlur).not.called
  })
})

it('blur the activeElement when clicking the body', () => {
  cy
  .visit('http://localhost:3500/fixtures/active-elements.html')
  .then(() => {
    const events = []

    expect(cy.getFocused()).to.be.null

    const doc = cy.state('document')

    // programmatically focus the first, then second input element
    const $body = cy.$$('body')
    const $one = cy.$$('#one')
    const $two = cy.$$('#two');

    ['focus', 'blur'].forEach((evt) => {
      $one.on(evt, (e) => {
        events.push(e.originalEvent)
      })

      $two.on(evt, (e) => {
        events.push(e.originalEvent)
      })
    })

    $one.get(0).focus()
    $two.get(0).focus()

    cy.then(() => {
      // if we currently have focus it means
      // that the browser should fire the
      // native event immediately
      expect(events).to.have.length(3)

      expect(_.toPlainObject(events[0])).to.include({
        type: 'focus',
        isTrusted: true,
        target: $one.get(0),
      })

      expect(_.toPlainObject(events[1])).to.include({
        type: 'blur',
        isTrusted: true,
        target: $one.get(0),
      })

      expect(_.toPlainObject(events[2])).to.include({
        type: 'focus',
        isTrusted: true,
        target: $two.get(0),
      })
    })

    cy
    .get('body').click()
    .then(() => {
      expect(doc.activeElement).to.eq($body.get(0))
    })

    cy.then(() => {
      // if we had focus then no additional
      // focus event is necessary
      expect(events).to.have.length(4)

      expect(_.toPlainObject(events[3])).to.include({
        type: 'blur',
        isTrusted: true,
        target: $two.get(0),
      })
    })
  })
})

describe('polyfill programmatic blur events', () => {
  // restore these props for the rest of the tests
  let stubElementFocus
  let stubElementBlur
  let stubSVGFocus
  let stubSVGBlur
  let stubHasFocus
  let oldActiveElement = null

  const setActiveElement = (el) => {
    Object.defineProperty(cy.state('document'), 'activeElement', {
      get () {
        return el
      },
      configurable: true,
    })
  }

  beforeEach(() => {
    oldActiveElement = Object.getOwnPropertyDescriptor(window.Document.prototype, 'activeElement')

    // simulate window being out of focus by overwriting
    // the focus/blur methods on HTMLElement
    stubHasFocus = cy.stub(window.top.document, 'hasFocus').returns(false)

    stubElementFocus = cy.stub(window.top.HTMLElement.prototype, 'focus')
    stubElementBlur = cy.stub(window.top.HTMLElement.prototype, 'blur')
    stubSVGFocus = cy.stub(window.top.SVGElement.prototype, 'focus')
    stubSVGBlur = cy.stub(window.top.SVGElement.prototype, 'blur')
  })

  afterEach(() => {
    Object.defineProperty(window.Document.prototype, 'activeElement', oldActiveElement)
    stubHasFocus.restore()
    stubElementFocus.restore()
    stubElementBlur.restore()
    stubSVGFocus.restore()
    stubSVGBlur.restore()
  })

  // https://github.com/cypress-io/cypress/issues/1486
  it('simulated events when window is out of focus when .focus called', () => {
    cy
    .visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      // programmatically focus the first, then second input element
      const $one = cy.$$('#one')
      const $two = cy.$$('#two')

      const stub = cy.stub().as('focus/blur event').callsFake(() => {
        Cypress.log({})
      });

      ['focus', 'blur'].forEach((evt) => {
        $one.on(evt, stub)

        return $two.on(evt, stub)
      })

      $one.get(0).focus()
      // a hack here becuase we nuked the real .focus
      setActiveElement($one.get(0))

      $two.get(0).focus()
      // cy.get('#two').click()

      const getEvent = (n) => {
        return stub.getCall(n).args[0].originalEvent
      }

      cy.wrap(null).then(() => {
        expect(stub).to.be.calledThrice

        expect(getEvent(0)).to.containSubset({
          type: 'focus',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(getEvent(1)).to.containSubset({
          type: 'blur',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(getEvent(2)).to.containSubset({
          type: 'focus',
          target: $two.get(0),
          isTrusted: false,
        })
      })
      .then(() => {
        stub.resetHistory()

        setActiveElement($two.get(0))

        $two.get(0).focus()

        expect(stub, 'should not send focus if already focused el').not.called
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/1176
  it('simulated events when window is out of focus when .blur called', () => {
    cy
    .visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      // programmatically focus the first, then second input element
      const $one = cy.$$('#one')
      const $two = cy.$$('#two')

      const stub = cy.stub().as('focus/blur event');

      ['focus', 'blur'].forEach((evt) => {
        $one.on(evt, stub)

        $two.on(evt, stub)
      })

      $one.get(0).focus()

      // a hack here becuase we nuked the real .focus
      setActiveElement($one.get(0))

      $one.get(0).blur()

      cy.then(() => {
        expect(stub).calledTwice

        expect(_.toPlainObject(stub.getCall(0).args[0].originalEvent)).to.containSubset({
          type: 'focus',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(_.toPlainObject(stub.getCall(1).args[0].originalEvent)).to.containSubset({
          type: 'blur',
          target: $one.get(0),
          isTrusted: false,
        })
      })

      .then(() => {
        stub.resetHistory()

        setActiveElement(cy.$$('body').get(0))

        $one.get(0).blur()

        expect(stub, 'should not send blur if not focused el').not.called
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/1486
  it('SVGElement simulated events when window is out of focus when .focus called', () => {
    cy
    .visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      // programmatically focus the first, then second input element

      const $one = cy.$$(`<svg id="svg-one" tabindex width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
    </svg>`).appendTo(cy.$$('body'))
      const $two = cy.$$(`<svg id="svg-two" tabindex width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
    </svg>`).appendTo(cy.$$('body'))

      const stub = cy.stub().as('focus/blur event').callsFake(() => {
        Cypress.log({})
      });

      ['focus', 'blur'].forEach((evt) => {
        $one.on(evt, stub)

        return $two.on(evt, stub)
      })

      $one.get(0).focus()
      // a hack here becuase we nuked the real .focus
      setActiveElement($one.get(0))

      $two.get(0).focus()
      // cy.get('#two').click()

      const getEvent = (n) => {
        return stub.getCall(n).args[0].originalEvent
      }

      cy.wrap(null).then(() => {
        expect(stub).to.be.calledThrice

        expect(getEvent(0)).to.containSubset({
          type: 'focus',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(getEvent(1)).to.containSubset({
          type: 'blur',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(getEvent(2)).to.containSubset({
          type: 'focus',
          target: $two.get(0),
          isTrusted: false,
        })
      })
      .then(() => {
        stub.resetHistory()

        setActiveElement($two.get(0))

        $two.get(0).focus()

        expect(stub, 'should not send focus if already focused el').not.called
      })
    })
  })

  // https://github.com/cypress-io/cypress/issues/1176
  it('SVGElement simulated events when window is out of focus when .blur called', () => {
    cy
    .visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      // programmatically focus the first, then second input element

      const $one = cy.$$(`<svg id="svg-one" tabindex width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
    </svg>`).appendTo(cy.$$('body'))
      const $two = cy.$$(`<svg id="svg-two" tabindex width="100" height="100">
      <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
    </svg>`).appendTo(cy.$$('body'))
      const stub = cy.stub().as('focus/blur event');

      ['focus', 'blur'].forEach((evt) => {
        $one.on(evt, stub)

        $two.on(evt, stub)
      })

      $one.get(0).focus()

      // a hack here becuase we nuked the real .focus
      setActiveElement($one.get(0))

      $one.get(0).blur()

      cy.then(() => {
        expect(stub).calledTwice

        expect(_.toPlainObject(stub.getCall(0).args[0].originalEvent)).to.containSubset({
          type: 'focus',
          target: $one.get(0),
          isTrusted: false,
        })

        expect(_.toPlainObject(stub.getCall(1).args[0].originalEvent)).to.containSubset({
          type: 'blur',
          target: $one.get(0),
          isTrusted: false,
        })
      })

      .then(() => {
        stub.resetHistory()

        setActiveElement(cy.$$('body').get(0))

        $one.get(0).blur()

        expect(stub, 'should not send blur if not focused el').not.called
      })
    })
  })

  it('document.hasFocus() always returns true', () => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html')
    cy.document().then((doc) => {
      expect(doc.hasFocus(), 'hasFocus returns true').eq(true)
    })
  })

  it('does not send focus events for non-focusable elements', () => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      cy.$$('<div id="no-focus">clearly not a focusable element</div>')
      .appendTo(cy.$$('body'))

      const stub = cy.stub()
      const el1 = cy.$$('#no-focus')
      const win = cy.$$(cy.state('window'))

      win.on('focus', stub)
      el1.on('focus', stub)
      el1[0].focus()

      expect(stub).not.called
    })
  })
})

describe('intercept blur methods correctly', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html').then(() => {
      // cy.$$('input:first').focus()
      // cy.$$('body').focus()
      top.focus()
      cy.state('document').onselectionchange = cy.stub()
      .as('selectionchange')

      let called = false

      cy.get('@selectionchange').then((v) => {
        v.callsFake(() => {
          if (called) return

          called = true
          Cypress.log({ message: 'reset mock', state: 'passed' })
          setImmediate(() => v.reset())
        })
      })

      cy.$$('input:first')[0].focus()

      cy.wait(10).get('@selectionchange').should('not.be.called')
    })
  })

  it('focus  <a>', () => {
    const $el = cy.$$('<a href="#">foo</a>')

    $el.appendTo(cy.$$('body'))

    cy.wrap($el[0]).focus()
    .should('have.focus')

    if (Cypress.isBrowser('firefox')) {
      cy.wait(0).get('@selectionchange').should('be.called')

      return
    }

    cy.wait(10).get('@selectionchange').should('not.be.called')
  })

  it('focus <select>', () => {
    const $el = cy.$$('<select>')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()
    cy.wrap($el[0]).focus()
    .should('have.focus')

    if (Cypress.isBrowser('firefox')) {
      cy.wait(0).get('@selectionchange').should('be.called')

      return
    }

    cy.wait(10).get('@selectionchange').should('not.be.called')
  })

  it('focus <button>', () => {
    const $el = cy.$$('<button/>')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()
    cy.wrap($el[0]).focus()
    .should('have.focus')

    if (Cypress.isBrowser('firefox')) {
      cy.wait(0).get('@selectionchange').should('be.called')

      return
    }

    cy.wait(10).get('@selectionchange').should('not.be.called')
  })

  it('focus <iframe>', () => {
    const $el = cy.$$('<iframe src="" />')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()
    cy.wrap($el[0]).focus()
    .should('have.focus')

    cy.wait(0).get('@selectionchange').should('not.be.called')
  })

  it('focus [tabindex]', () => {
    const $el = cy.$$('<div tabindex="1">tabindex</div>')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()

    if (Cypress.isBrowser('firefox')) {
      cy.wait(0).get('@selectionchange').should('be.called')

      return
    }

    cy.wait(0).get('@selectionchange').should('not.be.called')
  })

  it('focus <textarea>', () => {
    const $el = cy.$$('<textarea/>')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()
    cy.wrap($el[0]).focus()
    .should('have.focus')

    cy.get('@selectionchange').should('be.called')
  })

  it('focus [contenteditable]', () => {
    const $el = cy.$$('<div contenteditable>contenteditable</div>')

    $el.appendTo(cy.$$('body'))
    $el[0].focus()

    cy.get('@selectionchange').should('be.called')
  })

  it('cannot focus a [contenteditable] child', () => {
    const outer = cy.$$('<div contenteditable>contenteditable</div>').appendTo(cy.$$('body'))
    const inner = cy.$$('<div>first inner contenteditable</div>').appendTo(outer)

    cy.$$('<div>second inner contenteditable</div>').appendTo(outer)

    cy.get('input:first').focus()
    .wait(0)
    .get('@selectionchange').then((stub) => stub.resetHistory())

    cy.wrap(inner).should(($el) => $el.focus)
    .wait(0)

    cy.get('input:first').should('have.focus')

    cy.get('@selectionchange').should('not.be.called')
  })

  it('focus svg', () => {
    const $svg = cy.$$(`<svg tabindex="1" width="900px" height="500px" viewBox="0 0 95 50" style="border: solid red 1px;"
      xmlns="http://www.w3.org/2000/svg">
     <g data-Name="group" stroke="green" fill="white" stroke-width="5" data-tabindex="0" >
       <a xlink:href="#">
         <circle cx="20" cy="25" r="5" data-Name="shape 1"  data-tabindex="0" />
       </a>
       <a xlink:href="#">
         <circle cx="40" cy="25" r="5" data-Name="shape 2"  data-tabindex="0" />
       </a>
       <a xlink:href="#">
         <circle cx="60" cy="25" r="5" data-Name="shape 3" data-tabindex="0" />
       </a>
       <a xlink:href="#">
         <circle cx="80" cy="25" r="5" data-Name="shape 4" data-tabindex="0" />
       </a>
     </g>
  </svg>`).appendTo(cy.$$('body'))

    cy.wrap($svg).focus().should('have.focus')
  })

  it('focus area', () => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html').then(() => {
      cy.$$(`
      <map name="map">
      <area shape="circle" coords="0,0,100"
      href="#"
      target="_blank" alt="area" />
      </map>
      <img usemap="#map" src="/__cypress/static/favicon.ico" alt="image" />
      `).appendTo(cy.$$('body'))

      cy.get('area')
      // NOTE: wait needed for firefox, otherwise element is not yet ready/loaded
      .wait(100)
      .focus()
      .should('have.focus')
    })
  })

  // W3C Hidden @see html.spec.whatwg.org/multipage/interaction.html#focusable-area
  // fix https://github.com/cypress-io/cypress/issues/4898
  it('does not send focus events for focusable elements that are w3c hidden', () => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      cy.$$('<input style="visibility:hidden" id="no-focus-1"/>')
      .appendTo(cy.$$('body'))

      cy.$$('<input style="display:none" id="no-focus-2"/>')
      .appendTo(cy.$$('body'))

      cy.$$('<div style="visibility:hidden"><input id="no-focus-3"/></div>')
      .appendTo(cy.$$('body'))

      cy.$$('<div style="display:none"><input id="no-focus-4"/></div>')
      .appendTo(cy.$$('body'))

      const stub = cy.stub().as('focus')

      cy.$$('#no-focus-1').on('focus', stub).get(0).focus()
      cy.$$('#no-focus-2').on('focus', stub).get(0).focus()
      cy.$$('#no-focus-3').on('focus', stub).get(0).focus()
      cy.$$('#no-focus-4').on('focus', stub).get(0).focus()

      expect(stub).not.called

      cy.get('no-focus-1').should('not.be.visible')
      cy.get('no-focus-2').should('not.be.visible')
      cy.get('no-focus-3').should('not.be.visible')
      cy.get('no-focus-4').should('not.be.visible')
    })
  })

  // W3C Hidden @see html.spec.whatwg.org/multipage/interaction.html#focusable-area
  // fix https://github.com/cypress-io/cypress/issues/4898
  it('does send focus events for focusable elements that are 0x0 size', () => {
    cy.visit('http://localhost:3500/fixtures/active-elements.html')
    .then(() => {
      cy.$$('<input style="width:0;height:0;padding:0;margin:0;border:0;outline:0" id="focus-1"/>')
      .appendTo(cy.$$('body'))

      const stub = cy.stub()

      cy.$$('#focus-1')
      .on('focus', stub)
      .get(0).focus()

      expect(stub).calledOnce

      cy.get('#focus-1').should('not.be.visible')
    })
  })
})
