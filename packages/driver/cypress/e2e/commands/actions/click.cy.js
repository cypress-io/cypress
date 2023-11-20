const { _, $, Promise } = Cypress
const {
  assertLogLength,
  clickCommandLog,
  attachListeners,
  shouldBeCalledWithCount,
  shouldBeCalled,
  shouldBeCalledOnce,
  shouldNotBeCalled,
  expectCaret,
} = require('../../../support/utils')

const fail = function (str) {
  throw new Error(str)
}

const mouseClickEvents = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']
const mouseHoverEvents = [
  'pointerout',
  'pointerleave',
  'pointerover',
  'pointerenter',
  'mouseout',
  'mouseleave',
  'mouseover',
  'mouseenter',
  'pointermove',
  'mousemove',
]
const focusEvents = ['focus', 'focusin']

const attachFocusListeners = attachListeners(focusEvents)
const attachMouseClickListeners = attachListeners(mouseClickEvents)
const attachMouseHoverListeners = attachListeners(mouseHoverEvents)
const attachMouseDblclickListeners = attachListeners(['dblclick'])
const attachContextmenuListeners = attachListeners(['contextmenu'])

const overlayStyle = { position: 'fixed', top: 0, width: '100%', height: '100%', opacity: 0.5 }
const getMidPoint = (el) => {
  const box = el.getBoundingClientRect()
  const midX = Math.ceil(box.left + box.width / 2 + el.ownerDocument.defaultView.scrollX)
  const midY = Math.ceil(box.top + box.height / 2 + el.ownerDocument.defaultView.scrollY)

  return { x: midX, y: midY }
}

const isFirefox = Cypress.isBrowser('firefox')
const isWebKit = Cypress.isBrowser('webkit')
const isChromium116OrLater = Cypress.isBrowser({ family: 'chromium' }) && Cypress.browserMajorVersion() >= 116

describe('src/cy/commands/actions/click', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#click', () => {
    it('receives native click event', (done) => {
      const $btn = cy.$$('#button')

      $btn.on('click', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'view', 'button', 'buttons', 'which', 'relatedTarget', 'altKey', 'ctrlKey', 'shiftKey', 'metaKey', 'detail', 'type')

        expect(obj).to.deep.eq({
          bubbles: true,
          cancelable: true,
          view: cy.state('window'),
          button: 0,
          buttons: 0,
          which: 1,
          relatedTarget: null,
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
          metaKey: false,
          detail: 1,
          type: 'click',
        })

        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        done()
      })

      cy.get('#button').click()
    })

    it('bubbles up native click event', (done) => {
      const click = () => {
        cy.state('window').removeEventListener('click', click)

        done()
      }

      cy.state('window').addEventListener('click', click)

      cy.get('#button').click()
    })

    it('sends native mousedown event', (done) => {
      const $btn = cy.$$('#button')

      const win = cy.state('window')

      $btn.get(0).addEventListener('mousedown', (e) => {
        // calculate after scrolling
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        const obj = _.pick(e, 'bubbles', 'cancelable', 'view', 'button', 'buttons', 'which', 'relatedTarget', 'altKey', 'ctrlKey', 'shiftKey', 'metaKey', 'detail', 'type')

        expect(obj).to.deep.eq({
          bubbles: true,
          cancelable: true,
          view: win,
          button: 0,
          buttons: 1,
          which: 1,
          relatedTarget: null,
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
          metaKey: false,
          detail: 1,
          type: 'mousedown',
        })

        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        done()
      })

      cy.get('#button').click()
    })

    it('sends native mouseup event', (done) => {
      const $btn = cy.$$('#button')

      const win = cy.state('window')

      $btn.get(0).addEventListener('mouseup', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        const obj = _.pick(e, 'bubbles', 'cancelable', 'view', 'button', 'buttons', 'which', 'relatedTarget', 'altKey', 'ctrlKey', 'shiftKey', 'metaKey', 'detail', 'type')

        expect(obj).to.deep.eq({
          bubbles: true,
          cancelable: true,
          view: win,
          button: 0,
          buttons: 0,
          which: 1,
          relatedTarget: null,
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
          metaKey: false,
          detail: 1,
          type: 'mouseup',
        })

        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        done()
      })

      cy.get('#button').click()
    })

    it('sends mousedown, mouseup, click events in order', () => {
      const events = []

      const $btn = cy.$$('#button')

      _.each('mousedown mouseup click'.split(' '), (event) => {
        $btn.get(0).addEventListener(event, () => {
          events.push(event)
        })
      })

      cy.get('#button').click().then(() => {
        expect(events).to.deep.eq(['mousedown', 'mouseup', 'click'])
      })
    })

    it('sends pointer and mouse events in order', () => {
      const events = []
      const $btn = cy.$$('#button')

      _.each('pointerdown mousedown pointerup mouseup click'.split(' '), (event) => {
        $btn.get(0).addEventListener(event, () => {
          events.push(event)
        })
      })

      cy.get('#button').click().then(() => {
        expect(events).to.deep.eq(['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'])
      })
    })

    it('records correct clientX when el scrolled', (done) => {
      const $btn = $(`<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>`).appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.get(0).addEventListener('click', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)

        done()
      })

      cy.get('#scrolledBtn').click()
    })

    it('records correct clientY when el scrolled', (done) => {
      const $btn = $(`<button id='scrolledBtn' style='position: absolute; top: 1600px; left: 1200px; width: 100px;'>foo</button>`).appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.get(0).addEventListener('click', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollY).to.be.gt(0)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        done()
      })

      cy.get('#scrolledBtn').click()
    })

    it('will send all events even mousedown is defaultPrevented', () => {
      const $btn = cy.$$('#button')

      $btn.get(0).addEventListener('mousedown', (e) => {
        e.preventDefault()
        expect(e.defaultPrevented).to.be.true
      })

      attachMouseClickListeners({ $btn })

      cy.get('#button').click().should('not.have.focus')

      cy.getAll('$btn', 'pointerdown mousedown pointerup mouseup click').each(shouldBeCalled)
    })

    it('will not send mouseEvents/focus if pointerdown is defaultPrevented', () => {
      const $btn = cy.$$('#button')

      const onEvent = cy.stub().callsFake((e) => {
        e.preventDefault()
        expect(e.defaultPrevented).to.be.true
      })

      $btn.get(0).addEventListener('pointerdown', onEvent)

      attachMouseClickListeners({ $btn })

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.get('#button').click().should('not.have.focus')

      cy.getAll('$btn', 'pointerdown pointerup click').each(shouldBeCalledOnce)
      cy.getAll('$btn', 'mousedown mouseup').each(shouldNotBeCalled)
    })

    it('sends a click event', (done) => {
      cy.$$('#button').click(() => {
        done()
      })

      cy.get('#button').click()
    })

    it('returns the original subject', () => {
      const button = cy.$$('#button')

      cy.get('#button').click().then(($button) => {
        expect($button).to.match(button)
      })
    })

    it('causes focusable elements to receive focus', () => {
      const el = cy.$$(':text:first')

      attachFocusListeners({ el })

      cy.get(':text:first').click().should('have.focus')

      cy.getAll('el', 'focus focusin').each(shouldBeCalledOnce)
    })

    // https://github.com/cypress-io/cypress/issues/24900
    it('retains focus after clicking', () => {
      cy.$$('#button').on('blur', cy.stub().as('blur'))

      cy.get('#button').click()
      cy.get('@blur').should('not.be.called')
    })

    // https://github.com/cypress-io/cypress/issues/5430
    it('does not attempt to click element outside viewport', (done) => {
      cy.timeout(100)
      cy.on('fail', (err) => {
        expect(err.message).contain('id="email-with-value"')
        expect(err.message).contain('hidden from view')
        done()
      })

      cy.$$('#tabindex').css(overlayStyle)
      cy.get('#email-with-value').click()
    })

    it('can click element outside viewport with force:true', () => {
      cy.$$('#tabindex').css(overlayStyle)
      cy.get('#email-with-value').click({ force: true })
    })

    it('does not fire a focus, mouseup, or click event when element has been removed on mousedown', () => {
      const $btn = cy.$$('button:first')

      $btn.on('mousedown', function () {
        // synchronously remove this button
        $(this).remove()
      })

      $btn.on('focus', () => {
        fail('should not have gotten focus')
      })

      $btn.on('focusin', () => {
        fail('should not have gotten focusin')
      })

      $btn.on('mouseup', () => {
        fail('should not have gotten mouseup')
      })

      $btn.on('click', () => {
        fail('should not have gotten click')
      })

      cy.contains('button').click()
    })

    it('events when element removed on pointerdown', () => {
      const btn = cy.$$('button:first').css({ transform: 'translateY(-50px)' })
      const div = cy.$$('div#tabindex')

      attachFocusListeners({ btn })
      attachMouseClickListeners({ btn, div })
      attachMouseHoverListeners({ btn, div })

      btn.on('pointerdown', () => {
        // synchronously remove this button
        btn.remove()
      })

      cy.contains('button').click()

      cy.getAll('btn', 'pointerdown').each(shouldBeCalled)
      cy.getAll('btn', 'mousedown mouseup').each(shouldNotBeCalled)
      cy.getAll('div', 'pointerover pointerenter mouseover mouseenter pointerup mouseup').each(shouldBeCalled)
    })

    it('events when element removed on pointerover', () => {
      const btn = cy.$$('button:first').css({ transform: 'translateY(-50px)' })
      const div = cy.$$('div#tabindex')

      // attachFocusListeners({ btn })
      attachMouseClickListeners({ btn, div })
      attachMouseHoverListeners({ btn, div })

      btn.on('pointerover', () => {
        // synchronously remove this button
        btn.remove()
      })

      cy.contains('button').click()

      cy.getAll('btn', 'pointerover pointerenter').each(shouldBeCalled)
      cy.getAll('btn', 'pointerdown mousedown mouseover mouseenter').each(shouldNotBeCalled)
      cy.getAll('div', 'pointerover pointerenter pointerdown mousedown pointerup mouseup click').each(shouldBeCalled)
    })

    // https://github.com/cypress-io/cypress/issues/5459
    it('events when element moved on mousedown', () => {
      const btn = cy.$$('button:first')
      const div = cy.$$('div#tabindex')
      const root = cy.$$('#dom')

      attachFocusListeners({ btn, div })
      attachMouseClickListeners({ btn, div, root })
      attachMouseHoverListeners({ btn, div })

      const onEvent = cy.stub().callsFake(() => {
        div.css(overlayStyle)
      })

      btn.on('mousedown', onEvent)

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.contains('button').click()

      cy.getAll('btn', 'mouseover mouseenter mousedown focus').each(shouldBeCalled)
      cy.getAll('btn', 'click mouseup').each(shouldNotBeCalled)
      cy.getAll('div', 'mouseover mouseenter mouseup').each(shouldBeCalled)
      cy.getAll('div', 'click focus').each(shouldNotBeCalled)
      cy.getAll('root', 'click').each(shouldBeCalled)
    })

    it('events when element moved on mouseup', () => {
      const btn = cy.$$('button:first')
      const div = cy.$$('div#tabindex')

      attachFocusListeners({ btn, div })
      attachMouseClickListeners({ btn, div })
      attachMouseHoverListeners({ btn, div })

      const onEvent = cy.stub().callsFake(() => {
        div.css(overlayStyle)
      })

      btn.on('mouseup', onEvent)

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.contains('button').click()

      cy.getAll('btn', 'mouseover mouseenter mousedown focus click mouseup').each(shouldBeCalled)
      cy.getAll('div', 'mouseover mouseenter').each(shouldBeCalled)
      cy.getAll('div', 'focus click mouseup mousedown').each(shouldNotBeCalled)
    })

    it('events when element moved on click', () => {
      const btn = cy.$$('button:first')
      const div = cy.$$('div#tabindex')

      attachFocusListeners({ btn, div })
      attachMouseClickListeners({ btn, div })
      attachMouseHoverListeners({ btn, div })

      const onEvent = cy.stub().callsFake(() => {
        div.css(overlayStyle)
      })

      btn.on('click', onEvent)

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.contains('button').click()

      cy.getAll('btn', 'mouseover mouseenter mousedown focus click mouseup').each(shouldBeCalled)
      cy.getAll('div', 'focus click mouseup mousedown').each(shouldNotBeCalled)
    })

    // https://github.com/cypress-io/cypress/issues/5578
    it('click when mouseup el is child of mousedown el', () => {
      const btn = cy.$$('button:first')
      const span = $('<span>foooo</span>')

      attachFocusListeners({ btn, span })
      attachMouseClickListeners({ btn, span })
      attachMouseHoverListeners({ btn, span })

      const onEvent = cy.stub().callsFake(() => {
        // clicked = true
        btn.html('')
        btn.append(span)
      })

      btn.on('mousedown', onEvent)

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.contains('button').click()

      cy.getAll('btn', 'mousedown focus click mouseup').each(shouldBeCalled)
      cy.getAll('span', 'mouseup').each(shouldBeCalled)
      cy.getAll('span', 'focus click mousedown').each(shouldNotBeCalled)
    })

    it('click when mousedown el is child of mouseup el', () => {
      const btn = cy.$$('button:first')
      const span = $('<span>foooo</span>')

      attachFocusListeners({ btn, span })
      attachMouseClickListeners({ btn, span })
      attachMouseHoverListeners({ btn, span })

      btn.html('')
      btn.append(span)

      const onEvent = cy.stub().callsFake(() => {
        span.css({ marginLeft: 50 })
      })

      btn.on('mousedown', onEvent)

      cy.get('button:first').click()

      cy.getAll('btn', 'mousedown focus click mouseup').each(shouldBeCalled)
      cy.getAll('span', 'mousedown').each(shouldBeCalled)
      cy.getAll('span', 'focus click mouseup').each(shouldNotBeCalled)
    })

    // https://github.com/cypress-io/cypress/issues/6923
    it('no click when mouseUpPhase targetEl is detached', () => {
      const btn = cy.$$('button:first')
      const span1 = $('<span>foooo</span>')
      const span2 = $('<span>baaaar</span>')

      attachFocusListeners({ btn, span1, span2 })
      attachMouseClickListeners({ btn, span1, span2 })
      attachMouseHoverListeners({ btn, span1, span2 })

      btn.html('')
      btn.append(span1)

      const onEvent = cy.stub().callsFake(() => {
        span1.hide()
        btn.append(span2)
      })

      btn.on('mousedown', onEvent)
      btn.on('mouseup', () => {
        span2.remove()
      })

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.get('button:first').click()

      cy.getAll('btn', 'mouseenter mousedown mouseup focus').each(shouldBeCalled)
      cy.getAll('btn', 'click').each(shouldNotBeCalled)
      cy.getAll('span1', 'mouseover mouseenter mousedown').each(shouldBeCalled)
      cy.getAll('span1', 'focus click mouseup').each(shouldNotBeCalled)
      cy.getAll('span2', 'mouseup mouseover mouseenter').each(shouldBeCalled)
      cy.getAll('span2', 'focus click mousedown').each(shouldNotBeCalled)
    })

    it('no click when new element at coords is not ancestor', () => {
      const btn = cy.$$('button:first')
      const span1 = $('<span>foooo</span>')
      const span2 = $('<span>baaaar</span>')

      attachFocusListeners({ btn, span1, span2 })
      attachMouseClickListeners({ btn, span1, span2 })
      attachMouseHoverListeners({ btn, span1, span2 })

      btn.html('')
      btn.append(span1)

      const onEvent = cy.stub().callsFake(() => {
        btn.html('')
        btn.append(span2)
      })

      btn.on('mousedown', onEvent)

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.get('button:first').click()

      cy.getAll('btn', 'mouseenter mousedown mouseup').each(shouldBeCalled)
      cy.getAll('btn', 'click focus').each(shouldNotBeCalled)
      cy.getAll('span1', 'mouseover mouseenter mousedown').each(shouldBeCalled)
      cy.getAll('span1', 'focus click mouseup').each(shouldNotBeCalled)
      cy.getAll('span2', 'mouseup mouseover mouseenter').each(shouldBeCalled)
      cy.getAll('span2', 'focus click mousedown').each(shouldNotBeCalled)
    })

    it('does not fire a click when element has been removed on mouseup', () => {
      const $btn = cy.$$('button:first')

      $btn.on('mouseup', function () {
        // synchronously remove this button
        $(this).remove()
      })

      $btn.on('click', () => {
        fail('btn should not have gotten click')
      })

      cy.$$('body').on('click', (e) => {
        throw new Error('should not have happened')
      })

      cy.contains('button').click()
    })

    it('does not fire a click or mouseup when element has been removed on pointerup', () => {
      const $btn = cy.$$('button:first')

      $btn.on('pointerup', function () {
        // synchronously remove this button
        $(this).remove()
      })

      ;['mouseup', 'click'].forEach((eventName) => {
        $btn.on(eventName, () => {
          fail(`should not have gotten ${eventName}`)
        })
      })

      cy.contains('button').click()
    })

    it('sends modifiers', () => {
      const btn = cy.$$('button:first')

      attachMouseClickListeners({ btn })

      cy.get('input:first').type('{ctrl}{shift}', { release: false })
      cy.get('button:first').click()

      cy.getAll('btn', 'pointerdown mousedown pointerup mouseup click').each((stub) => {
        expect(stub).to.be.calledWithMatch({
          shiftKey: true,
          ctrlKey: true,
          metaKey: false,
          altKey: false,
        })
      })
    })

    it('silences errors on unfocusable elements', () => {
      cy.get('div:first').click({ force: true })
    })

    it('causes first focused element to receive blur', () => {
      let blurred = false

      cy.$$('input:first').blur(() => {
        blurred = true
      })

      cy
      .get('input:first').focus()
      .get('input:text:last').click()
      .then(() => {
        expect(blurred).to.be.true
      })
    })

    it('inserts artificial delay of 50ms', () => {
      cy.spy(Promise, 'delay')

      cy.get('#button').click().then(() => {
        expect(Promise.delay).to.be.calledWith(50)
      })
    })

    it('delays 50ms before resolving', () => {
      cy.$$('button:first').on('click', () => {
        cy.spy(Promise, 'delay')
      })

      cy.get('button:first').click({ multiple: true }).then(() => {
        expect(Promise.delay).to.be.calledWith(50, 'click')
      })
    })

    it('can operate on a jquery collection', () => {
      let clicks = 0
      const buttons = cy.$$('button').slice(0, 3)

      buttons.click(() => {
        clicks += 1

        return false
      })

      // make sure we have more than 1 button
      expect(buttons.length).to.be.gt(1)

      // make sure each button received its click event
      cy.get('button').invoke('slice', 0, 3).click({ multiple: true }).then(($buttons) => {
        expect($buttons.length).to.eq(clicks)
      })
    })

    it('can cancel multiple clicks', (done) => {
      cy.stub(Cypress.runner, 'stop')

      // abort after the 3rd click
      const stop = _.after(3, () => {
        Cypress.stop()
      })

      const clicked = cy.spy(() => {
        stop()
      })

      const $anchors = cy.$$('#sequential-clicks a')

      $anchors.on('click', clicked)

      // make sure we have at least 5 anchor links
      expect($anchors.length).to.be.gte(5)

      cy.on('stop', () => {
        // timeout will get called synchronously
        // again during a click if the click function
        // is called
        const timeout = cy.spy(cy.timeout)

        _.delay(() => {
          // and we should have stopped clicking after 3
          expect(clicked.callCount).to.eq(3)

          expect(timeout.callCount).to.eq(0)

          done()
        }
        , 100)
      })

      cy.get('#sequential-clicks a').click({ multiple: true })
    })

    it('serially clicks a collection', () => {
      const throttled = cy.stub().as('clickcount')

      // create a throttled click function
      // which proves we are clicking serially
      const handleClick = cy.stub()
      .callsFake(_.throttle(throttled, 0, { leading: false }))
      .as('handleClick')

      const $anchors = cy.$$('#sequential-clicks a')

      $anchors.on('click', handleClick)

      // make sure we're clicking multiple $anchors
      expect($anchors.length).to.be.gt(1)

      cy.get('#sequential-clicks a').click({ multiple: true }).then(($els) => {
        expect($els).to.have.length(throttled.callCount)
      })
    })

    it('requeries if the DOM rerenders during actionability', () => {
      cy.$$('[name=colors]').first().prop('disabled', true)

      const listener = _.after(3, () => {
        cy.$$('[name=colors]').first().prop('disabled', false)

        const parent = cy.$$('[name=colors]').parent()

        parent.replaceWith(parent[0].outerHTML)
        cy.off('command:retry', listener)
      })

      cy.on('command:retry', listener)

      cy.get('[name=colors]').first().click().then(($inputs) => {
        $inputs.each((i, el) => {
          expect($(el)).to.be.checked
        })
      })
    })

    it('increases the timeout delta after each click', () => {
      const count = cy.$$('#three-buttons button').length

      cy.spy(cy, 'timeout')

      cy.get('#three-buttons button').click({ multiple: true }).then(() => {
        const calls = cy.timeout.getCalls()

        const num = _.filter(calls, (call) => _.isEqual(call.args, [50, true]))

        expect(num.length).to.eq(count)
      })
    })

    it('each click gets a full command timeout', () => {
      cy.spy(cy, 'retry')

      cy.get('#three-buttons button').click({ multiple: true }).then(() => {
        const [firstCall, secondCall] = cy.retry.getCalls()
        const firstCallOptions = firstCall.args[1]
        const secondCallOptions = secondCall.args[1]

        // ensure we clone the options object passed to `retry()` so that
        // each click in `{ multiple: true }` gets its own full timeout
        expect(firstCallOptions !== secondCallOptions, 'Expected click retry options to be different object references between clicks').to.be.true
      })
    })

    // this test needs to increase the height + width of the div
    // when we implement scrollBy the delta of the left/top
    it('can click elements which are huge and the center is naturally below the fold', () => {
      cy.get('#massively-long-div').click()
    })

    it('can click a tr', () => {
      cy.get('#table tr:first').click()
    })

    it('places cursor at the end of input', () => {
      cy.get('input:first').invoke('val', 'foobar').click().then(($el) => {
        const el = $el.get(0)

        expect(el.selectionStart).to.eql(6)

        expect(el.selectionEnd).to.eql(6)
      })

      cy.get('input:first').invoke('val', '').click().then(($el) => {
        const el = $el.get(0)

        expect(el.selectionStart).to.eql(0)

        expect(el.selectionEnd).to.eql(0)
      })
    })

    it('places cursor at the end of textarea', () => {
      cy.get('textarea:first').invoke('val', 'foo\nbar\nbaz').click().then(($el) => {
        const el = $el.get(0)

        expect(el.selectionStart).to.eql(11)

        expect(el.selectionEnd).to.eql(11)
      })

      cy.get('textarea:first').invoke('val', '').click().then(($el) => {
        const el = $el.get(0)

        expect(el.selectionStart).to.eql(0)

        expect(el.selectionEnd).to.eql(0)
      })
    })

    it('places cursor at the end of [contenteditable]', () => {
      cy.get('[contenteditable]:first').as('edit')

      cy.get('@edit').invoke('html', '<div><br></div>')
      cy.get('@edit').click().then(expectCaret(0))

      cy.get('@edit').invoke('html', 'foo')
      cy.get('@edit').click().then(expectCaret(3))

      cy.get('@edit').invoke('html', '<div>foo</div>')
      cy.get('@edit').click().then(expectCaret(3))

      // firefox headless: prevent contenteditable from disappearing (dont set to empty)
      cy.get('@edit').invoke('html', '<br>')
      cy.get('@edit').click().then(expectCaret(0))
    })

    it('can click SVG elements', () => {
      const onClick = cy.stub()

      const $svgs = cy.$$('#svgs')

      $svgs.click(onClick)

      cy.get('[data-cy=line]').click().first().click()
      cy.get('[data-cy=rect]').click().first().click()

      cy.get('[data-cy=circle]').click().first().click()
      .then(() => {
        expect(onClick.callCount).to.eq(6)
      })
    })

    it('can click a canvas', () => {
      const onClick = cy.stub()

      const $canvas = cy.$$('#canvas')

      $canvas.click(onClick)

      const ctx = $canvas.get(0).getContext('2d')

      ctx.fillStyle = 'green'
      ctx.fillRect(10, 10, 100, 100)

      cy.get('#canvas').click().then(() => {
        expect(onClick).to.be.calledOnce
      })
    })

    describe('modifier options', () => {
      beforeEach(() => {
        cy.visit('/fixtures/issue-486.html')
      })

      it('ctrl', () => {
        cy.get('#button').click({
          ctrlKey: true,
        })

        cy.get('#result').should('contain', '{Ctrl}')

        // ctrl should be released
        cy.get('#button').click()
        cy.get('#result').should('not.contain', '{Ctrl}')

        cy.get('#button').click({
          controlKey: true,
        })

        cy.get('#result').should('contain', '{Ctrl}')
      })

      it('alt', () => {
        cy.get('#button').click({
          altKey: true,
        })

        cy.get('#result').should('contain', '{Alt}')

        // alt should be released
        cy.get('#button').click()
        cy.get('#result').should('not.contain', '{Alt}')

        cy.get('#button').click({
          optionKey: true,
        })

        cy.get('#result').should('contain', '{Alt}')
      })

      it('shift', () => {
        cy.get('#button').click({
          shiftKey: true,
        })

        cy.get('#result').should('contain', '{Shift}')

        // shift should be released
        cy.get('#button').click()
        cy.get('#result').should('not.contain', '{Shift}')
      })

      it('meta', () => {
        cy.get('#button').click({
          metaKey: true,
        })

        cy.get('#result').should('contain', '{Meta}')

        // shift should be released
        cy.get('#button').click()
        cy.get('#result').should('not.contain', '{Meta}')

        cy.get('#button').click({
          commandKey: true,
        })

        cy.get('#result').should('contain', '{Meta}')

        cy.get('#button').click({
          cmdKey: true,
        })

        cy.get('#result').should('contain', '{Meta}')
      })

      it('multiple', () => {
        cy.get('#button').click({
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
          metaKey: true,
        })

        cy.get('#result').should('contain', '{Ctrl}')
        cy.get('#result').should('contain', '{Alt}')
        cy.get('#result').should('contain', '{Shift}')
        cy.get('#result').should('contain', '{Meta}')

        // modifiers should be released
        cy.get('#button').click()
        cy.get('#result').should('not.contain', '{Ctrl}')
        cy.get('#result').should('not.contain', '{Alt}')
        cy.get('#result').should('not.contain', '{Shift}')
        cy.get('#result').should('not.contain', '{Meta}')
      })
    })

    describe('pointer-events:none', () => {
      beforeEach(function () {
        cy.$$('<div id="ptr" style="position:absolute;width:200px;height:200px;background-color:#08c18d;">behind #ptrNone</div>').appendTo(cy.$$('#dom'))
        this.ptrNone = cy.$$(`<div id="ptrNone" style="position:absolute;width:400px;height:400px;background-color:salmon;pointer-events:none;opacity:0.4;text-align:right">#ptrNone</div>`).appendTo(cy.$$('#dom'))
        cy.$$('<div id="ptrNoneChild" style="position:absolute;top:50px;left:50px;width:200px;height:200px;background-color:red">#ptrNone > div</div>').appendTo(this.ptrNone)

        this.logs = []
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })
      })

      it('element behind pointer-events:none should still get click', () => {
        cy.get('#ptr').click() // should pass with flying colors
      })

      it('should be able to force on pointer-events:none with force:true', () => {
        cy.get('#ptrNone').click({ timeout: 300, force: true })
      })

      it('should error with message about pointer-events', function (done) {
        cy.once('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.contain('has CSS `pointer-events: none`')
          expect(err.message).to.not.contain('inherited from')
          const consoleProps = lastLog.invoke('consoleProps')

          expect(_.keys(consoleProps)).deep.eq([
            'name',
            'type',
            'error',
            'props',
          ])

          expect(_.keys(consoleProps.props)).deep.eq([
            'Tried to Click',
            'But it has CSS',
          ])

          expect(consoleProps.props['But it has CSS']).to.eq('pointer-events: none')
          done()
        })

        cy.get('#ptrNone').click({ timeout: 300 })
      })

      it('should error with message about pointer-events and include inheritance', function (done) {
        cy.once('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.contain('has CSS `pointer-events: none`, inherited from this element:')
          expect(err.message).to.contain('<div id="ptrNone"')
          const consoleProps = lastLog.invoke('consoleProps')

          expect(_.keys(consoleProps)).deep.eq([
            'name',
            'type',
            'error',
            'props',
          ])

          expect(_.keys(consoleProps.props)).deep.eq([
            'Tried to Click',
            'But it has CSS',
            'Inherited From',
          ])

          expect(consoleProps.props['But it has CSS']).to.eq('pointer-events: none')

          expect(consoleProps.props['Inherited From']).to.eq(this.ptrNone.get(0))
          done()
        })

        cy.get('#ptrNoneChild').click({ timeout: 300 })
      })
    })

    describe('actionability', () => {
      let retries = 0

      beforeEach(() => {
        retries = 0
        cy.on('command:retry', () => {
          retries += 1
        })
      })

      it('can click on inline elements that wrap lines', () => {
        cy.get('#overflow-link').find('.wrapped').click()
      })

      // https://github.com/cypress-io/cypress/issues/7343
      it('can click on inline elements that wrap lines where the first rect has no width', () => {
        cy.get('#overflow-link-width').click()
      })

      it('can click on elements with `opacity: 0`', () => {
        cy.get('#opacity-0').click()
      })

      it('can click on elements with parents that have `opacity: 0`', () => {
        cy.get('#opacity-0-parent').click()
      })

      // readonly should only limit typing, not clicking
      it('can click on readonly inputs', () => {
        cy.get('#readonly-attr').click()
      })

      it('can click on readonly submit inputs', () => {
        cy.get('#readonly-submit').click()
      })

      it('can click on checkbox inputs', () => {
        cy.get(':checkbox:first').click()
        .then(($el) => {
          expect($el).to.be.checked
        })
      })

      it('can force click on disabled checkbox inputs', () => {
        cy.get(':checkbox:first')
        .then(($el) => {
          $el[0].disabled = true
        })
        .click({ force: true })
        .then(($el) => {
          expect($el).to.be.checked
        })
      })

      it('can click elements which are hidden until scrolled within parent container', () => {
        cy.get('#overflow-auto-container').contains('quux').click()
      })

      // https://github.com/cypress-io/cypress/issues/4233
      it('can click an element behind a sticky header', () => {
        cy.viewport(400, 400)
        cy.visit('./fixtures/sticky-header.html')
        cy.get('p').click()
      })

      it('does not scroll when being forced', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy
        .get('button:last').click({ force: true })
        .then(() => {
          expect(scrolled).to.be.empty
        })
      })

      it('does not scroll when position sticky and display flex', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.viewport(1000, 660)

        const $body = cy.$$('body')

        $body.children().remove()

        const $wrap = $('<div></div>')
        .attr('id', 'flex-wrap')
        .css({
          display: 'flex',
        })
        .prependTo($body)

        $(`<div><input type="text" data-cy="input" />
          <br><br>
          <a href="#" data-cy="button"> Button </a></div>\
        `)
        .attr('id', 'nav')
        .css({
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '200px',
          background: '#f0f0f0',
          borderRight: '1px solid silver',
          padding: '20px',
        })
        .appendTo($wrap)

        const $content = $('<div><h1>Hello</h1></div>')
        .attr('id', 'content')
        .css({
          padding: '20px',
          flex: 1,
        })
        .appendTo($wrap)

        $('<div>Long block 1</div>')
        .attr('id', 'long-block-1')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).appendTo($content)

        $('<div>Long block 2</div>')
        .attr('id', 'long-block-2')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).appendTo($content)

        $('<div>Long block 3</div>')
        .attr('id', 'long-block-3')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).appendTo($content)

        $('<div>Long block 4</div>')
        .attr('id', 'long-block-4')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).appendTo($content)

        $('<div>Long block 5</div>')
        .attr('id', 'long-block-5')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).appendTo($content)

        // make scrolling deterministic by ensuring we don't wait for coordsHistory
        // to build up
        cy.get('[data-cy=button]').click({ waitForAnimations: false }).then(() => {
          expect(scrolled).to.deep.eq(['element'])
        })
      })

      it('can specify scrollBehavior in options', () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click({ scrollBehavior: 'bottom' })

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).calledWith({ block: 'end' })
        })
      })

      it('does not scroll when scrollBehavior is false in options', () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click({ scrollBehavior: false })

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).not.to.be.called
        })
      })

      it('can specify scrollBehavior bottom in config', { scrollBehavior: 'bottom' }, () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).calledWith({ block: 'end' })
        })
      })

      it('can specify scrollBehavior center in config', { scrollBehavior: 'center' }, () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).calledWith({ block: 'center' })
        })
      })

      it('can specify scrollBehavior nearest in config', { scrollBehavior: 'nearest' }, () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).calledWith({ block: 'nearest' })
        })
      })

      it('does not scroll when scrollBehavior is false in config', { scrollBehavior: false }, () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).not.to.be.called
        })
      })

      it('calls scrollIntoView by default', () => {
        cy.get('input:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('input:first').click()

        cy.get('input:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'start' })
        })
      })

      it('errors when scrollBehavior is false and element is out of view and is clicked', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.click()` failed because the center of this element is hidden from view')
          expect(cy.state('window').scrollY).to.equal(0)
          expect(cy.state('window').scrollX).to.equal(0)

          done()
        })

        // make sure the input is out of view
        const $body = cy.$$('body')

        $('<div>Long block 5</div>')
        .css({
          height: '500px',
          border: '1px solid red',
          marginTop: '10px',
          width: '100%',
        }).prependTo($body)

        cy.get('input:first').click({ scrollBehavior: false, timeout: 200 })
      })

      it('can force click on hidden elements', () => {
        cy.get('button:first').invoke('hide').click({ force: true })
      })

      it('can force click on disabled elements', () => {
        cy.get('input:first').invoke('prop', 'disabled', true).click({ force: true })
      })

      it('can forcibly click even when being covered by another element', () => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))

        $('<span>span on button</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

        const scrolled = []
        let clicked = false

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        $btn.on('click', () => {
          clicked = true
        })

        cy.get('#button-covered-in-span').click({ force: true }).then(() => {
          expect(scrolled).to.be.empty
          expect(retries).to.eq(0)

          expect(clicked).to.be.true
        })
      })

      it('can forcibly click when being covered by element with `opacity: 0`', () => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))

        $('<span>span on button</span>').css({ opacity: 0, position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block' }).prependTo(cy.$$('body'))

        let clicked = false

        $btn.on('click', () => {
          clicked = true
        })

        cy.get('#button-covered-in-span').click({ force: true }).then(() => {
          expect(retries).to.be.eq(0)
          expect(clicked).to.be.true
        })
      })

      it('eventually clicks when covered up', () => {
        const $btn = $('<button>button covered</button>')
        .attr('id', 'button-covered-in-span')
        .prependTo(cy.$$('body'))

        const $span = $('<span>span on button</span>').css({
          position: 'absolute',
          left: $btn.offset().left,
          top: $btn.offset().top,
          padding: 5,
          display: 'inline-block',
          backgroundColor: 'yellow',
        }).prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy.on('command:retry', _.after(3, () => {
          $span.hide()
        }))

        cy.get('#button-covered-in-span').click().then(() => {
          expect(retries).to.be.gt(0)

          // - element scrollIntoView
          // - element scrollIntoView (retry animation coords)
          // - element scrollIntoView (retry covered)
          // - element scrollIntoView (retry covered)
          // - window
          expect(scrolled).to.deep.eq(['element', 'element', 'element', 'element'])
        })
      })

      it('scrolls the window past a fixed position element when being covered', () => {
        const spy = cy.spy().as('mousedown')

        $('<button>button covered</button>')
        .css({
          height: 24,
          width: 110,
        })
        .attr('id', 'button-covered-in-nav')
        .css({
          width: 120,
          height: 20,
        })
        .appendTo(cy.$$('#fixed-nav-test'))
        .mousedown(spy)

        $('<nav>nav on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window
        cy
        .get('#button-covered-in-nav').click()
        .then(($btn) => {
          const rect = $btn.get(0).getBoundingClientRect()
          const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

          // this button should be 120 pixels wide
          expect(rect.width).to.eq(120)

          const obj = spy.firstCall.args[0]

          // clientX + clientY are relative to the document
          expect(scrolled).to.deep.eq(['element', 'element', 'window'])
          expect(obj).property('clientX').closeTo(fromElViewport.leftCenter, 1)
          expect(obj).property('clientY').closeTo(fromElViewport.topCenter, 1)
        })
      })

      it('scrolls the window past two fixed positioned elements when being covered', () => {
        $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .appendTo(cy.$$('#fixed-nav-test'))

        $('<nav>nav on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        $('<nav>nav2 on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 40,
          padding: 20,
          backgroundColor: 'red',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window (nav1)
        // - window (nav2)
        cy.get('#button-covered-in-nav').click().then(() => {
          expect(scrolled).to.deep.eq(['element', 'element', 'window', 'window'])
        })
      })

      it('scrolls a container past a fixed position element when being covered', () => {
        cy.viewport(600, 450)

        const $body = cy.$$('body')

        // we must remove all of our children to
        // prevent the window from scrolling
        $body.children().remove()

        // this tests that our container properly scrolls!
        const $container = $('<div></div>')
        .attr('id', 'scrollable-container')
        .css({
          position: 'relative',
          width: 300,
          height: 200,
          marginBottom: 100,
          backgroundColor: 'green',
          overflow: 'auto',
        })
        .prependTo($body)

        $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .css({
          marginTop: 500,
          // marginLeft: 500
          marginBottom: 500,
        })
        .appendTo($container)

        $('<nav>nav on button</nav>')
        .css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        })
        .prependTo($container)

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window
        // - container
        cy.get('#button-covered-in-nav').click().then(() => {
          expect(scrolled).to.deep.eq(['element', 'element', 'window', 'container'])
        })
      })

      it('waits until element becomes visible', () => {
        const $btn = cy.$$('#button').hide()

        cy.on('command:retry', _.after(3, () => {
          $btn.show()
        }))

        cy.get('#button').click().then(() => {
          expect(retries).to.be.gt(0)
        })
      })

      it('waits until element is no longer disabled', () => {
        const $btn = cy.$$('#button').prop('disabled', true)

        let clicks = 0

        $btn.on('click', () => {
          clicks += 1
        })

        cy.on('command:retry', _.after(3, () => {
          $btn.prop('disabled', false)
        }))

        cy.get('#button').click().then(() => {
          expect(clicks).to.eq(1)

          expect(retries).to.be.gt(0)
        })
      })

      it('succeeds when DOM rerenders and returns new subject', () => {
        const $btn = cy.$$('#button').prop('disabled', true)

        cy.on('command:retry', _.after(3, () => {
          $btn.replaceWith('<button id="button">New Button</button>')
        }))

        cy.get('#button').click().should('contain', 'New Button')
      })

      it('waits until element stops animating', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).click().then(() => {
          expect(retries).to.gte(1)
        })
      })

      it('does not throw when waiting for animations is disabled', {
        waitForAnimations: false,
      }, () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).click().then(() => {
          expect(retries).to.eq(0)
        })
      })

      it('does not throw when turning off waitForAnimations in options', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).click({ waitForAnimations: false }).then(() => {
          expect(retries).to.eql(0)
        })
      })

      it('passes options.animationDistanceThreshold to $actionability.ensureElIsNotAnimating', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).click({ animationDistanceThreshold: 1000 }).then(() => {
          // One retry, because $actionability waits for two sets of position coordinates.
          expect(retries).to.eq(1)
        })
      })

      it('passes config.animationDistanceThreshold to $actionability.ensureElIsNotAnimating', () => {
        let old = Cypress.config('animationDistanceThreshold')

        Cypress.config('animationDistanceThreshold', 1000)

        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).click().then(() => {
          try {
            // One retry, because $actionability waits for two sets of position coordinates.
            expect(retries).to.eq(1)
          } finally {
            Cypress.config('animationDistanceThreshold', old)
          }
        })
      })

      describe('scroll-behavior', () => {
        afterEach(() => {
          cy.get('html').invoke('css', 'scrollBehavior', 'inherit')
        })

        // https://github.com/cypress-io/cypress/issues/3200
        it('can scroll to and click elements in html with scroll-behavior: smooth', () => {
          cy.get('html').invoke('css', 'scrollBehavior', 'smooth')
          cy.get('#table tr:first').click()
          // Validate that the scrollBehavior is still smooth even after the actionability fixes we do
          cy.get('html').invoke('css', 'scrollBehavior').then((scrollBehavior) => expect(scrollBehavior).to.eq('smooth'))
        })

        // https://github.com/cypress-io/cypress/issues/28150
        it('can scroll to and click elements in html with scroll-behavior: smooth and overflow-y: auto', () => {
          cy.get('html').invoke('css', 'scrollBehavior', 'smooth')
          cy.get('body').invoke('css', 'overflow-y', 'auto')
          cy.get('#table tr:first').click()
          // Validate that the scrollBehavior is still smooth even after the actionability fixes we do
          cy.get('html').invoke('css', 'scrollBehavior').then((scrollBehavior) => expect(scrollBehavior).to.eq('smooth'))
        })

        // https://github.com/cypress-io/cypress/issues/3200
        it('can scroll to and click elements in ancestor element with scroll-behavior: smooth', () => {
          cy.get('#dom').invoke('css', 'scrollBehavior', 'smooth')
          cy.get('#table tr:first').click()
          // Validate that the scrollBehavior is still smooth even after the actionability fixes we do
          cy.get('#dom').invoke('css', 'scrollBehavior').then((scrollBehavior) => expect(scrollBehavior).to.eq('smooth'))
        })
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        null
      })

      it('eventually passes the assertion', () => {
        cy.$$('button:first').click(function () {
          _.delay(() => {
            $(this).addClass('clicked')
          }
          , 50)

          return false
        })

        cy.get('button:first').click().should('have.class', 'clicked').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })

      it('eventually passes the assertion on multiple buttons', () => {
        cy.$$('button').click(function () {
          _.delay(() => {
            $(this).addClass('clicked')
          }
          , 50)

          return false
        })

        cy
        .get('button')
        .invoke('slice', 0, 2)
        .click({ multiple: true })
        .should('have.class', 'clicked')
      })
    })

    describe('position argument', () => {
      it('can click center by default', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 30, top: $btn.offset().top + 40, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click()
      })

      it('can click topLeft', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))

        const $span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        $span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('topLeft')
      })

      it('can click top', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 30, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('top')
      })

      it('can click topRight', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 80, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('topRight')
      })

      it('can click left', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top + 40, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('left')
      })

      it('can click center', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 30, top: $btn.offset().top + 40, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('center')
      })

      it('can click right', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 80, top: $btn.offset().top + 40, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('right')
      })

      it('can click bottomLeft', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top + 80, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('bottomLeft')
      })

      it('can click bottom', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 30, top: $btn.offset().top + 80, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('bottom')
      })

      it('can click bottomRight', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))
        const span = $('<span>span</span>').css({ position: 'absolute', left: $btn.offset().left + 80, top: $btn.offset().top + 80, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        const clicked = _.after(2, () => {
          done()
        })

        span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click('bottomRight')
      })

      it('can pass options along with position', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))

        $btn.on('click', () => {
          done()
        })

        cy.get('#button-covered-in-span').click('bottomRight', { force: true })
      })
    })

    describe('relative coordinate arguments', () => {
      it('can specify x and y', () => {
        const $btn = $('<button>button covered</button>')
        .attr('id', 'button-covered-in-span')
        .css({ height: 100, width: 100 })
        .prependTo(cy.$$('body'))

        const $span = $('<span>span</span>')
        .css({ position: 'absolute', left: $btn.offset().left + 50, top: $btn.offset().top + 65, padding: 5, display: 'inline-block', backgroundColor: 'yellow' })
        .appendTo($btn)

        cy.on('log:changed', (log, attr) => {
          if (log.name === 'click' && attr._emittedAttrs.coords) {
            expect(attr._emittedAttrs.coords).property('x')
            expect(attr._emittedAttrs.coords).property('y')
          }
        })

        const clicked = cy.stub()

        $span.on('click', clicked)
        $btn.on('click', clicked)

        cy.get('#button-covered-in-span').click(75, 78)
        .then(() => expect(clicked).calledTwice)
      })

      it('can pass options along with x, y', (done) => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').css({ height: 100, width: 100 }).prependTo(cy.$$('body'))

        $btn.on('click', () => {
          done()
        })

        cy.get('#button-covered-in-span').click(75, 78, { force: true })
      })

      // https://github.com/cypress-io/cypress/issues/7319
      it('can specify x and/or y to be 0', () => {
        const $btn = $('<button id="click-button">button</button>')
        .prependTo(cy.$$('body'))

        cy.on('log:changed', (log, attr) => {
          if (log.name === 'click' && attr._emittedAttrs.coords) {
            const args = attr._emittedAttrs.message.split(', ').map((i) => parseInt(i))
            const coords = attr._emittedAttrs.coords
            const position = Cypress.dom.getElementPositioning($btn).fromAutWindow

            expect(coords.x).to.equal(coords.left).to.equal(position.left + args[0])
            expect(coords.y).to.equal(coords.top).to.equal(position.top + args[1])
          }
        })

        cy.get('#click-button').click(2, 2)
        cy.get('#click-button').click(0, 0)
        cy.get('#click-button').click(0, 2)
        cy.get('#click-button').click(2, 0)
      })
    })

    describe('iframes', () => {
      // https://github.com/cypress-io/cypress/issues/5449
      it('can type into click inside iframe with hover state', () => {
        cy.$$('<iframe src="/fixtures/dom.html"/>').prependTo(cy.$$('body'))

        // type into aut
        cy.get('input:first').click()

        // type into iframe
        cy.get('iframe:first')
        .should((iframe) => expect(iframe.contents().find('#tabindex')).to.exist)
        .then((iframe) => cy.wrap(iframe.contents().find('#tabindex'), { log: false }))
        .click()

        // type into aut again
        cy.get('input:first').click()
      })
    })

    describe('mousedown', () => {
      it('gives focus after mousedown', (done) => {
        const input = cy.$$('input:first')

        input.get(0).addEventListener('focus', (e) => {
          const obj = _.pick(e, 'bubbles', 'cancelable', 'view', 'which', 'relatedTarget', 'detail', 'type')

          expect(obj).to.deep.eq({
            bubbles: false,
            cancelable: false,
            view: cy.state('window'),
            // chrome no longer fires pageX and pageY
            // pageX: 0
            // pageY: 0
            which: 0,
            relatedTarget: null,
            detail: 0,
            type: 'focus',
          })

          done()
        })

        cy.get('input:first').click()
      })

      it('gives focusin after mousedown', (done) => {
        const input = cy.$$('input:first')

        input.get(0).addEventListener('focusin', (e) => {
          const obj = _.pick(e, 'bubbles', 'cancelable', 'view', 'which', 'relatedTarget', 'detail', 'type')

          expect(obj).to.deep.eq({
            bubbles: true,
            cancelable: false,
            view: cy.state('window'),
            // pageX: 0
            // pageY: 0
            which: 0,
            relatedTarget: null,
            detail: 0,
            type: 'focusin',
          })

          done()
        })

        cy.get('input:first').click()
      })

      it('gives all events in order', () => {
        const events = []

        const input = cy.$$('input:first')

        _.each('focus focusin mousedown mouseup click'.split(' '), (event) => {
          input.get(0).addEventListener(event, () => {
            events.push(event)
          })
        })

        cy.get('input:first').click().then(() => {
          expect(events).to.deep.eq(['mousedown', 'focus', 'focusin', 'mouseup', 'click'])
        })
      })

      it('does not give focus if mousedown is defaultPrevented', (done) => {
        const input = cy.$$('input:first')

        input.get(0).addEventListener('focus', () => {
          done('should not have received focused event')
        })

        input.get(0).addEventListener('mousedown', (e) => {
          e.preventDefault()

          expect(e.defaultPrevented).to.be.true
        })

        cy.get('input:first').click().then(() => {
          done()
        })
      })

      it('still gives focus to the focusable element even when click is issued to child element', () => {
        const $btn = $('<button>', { id: 'button-covered-in-span' }).prependTo(cy.$$('body'))

        $('<span>span in button</span>').css({ padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).appendTo($btn)

        cy
        .get('#button-covered-in-span').click()
        .focused().should('have.id', 'button-covered-in-span')
      })

      it('will not fire focus events when nothing can receive focus', () => {
        const onFocus = cy.stub()
        const win = cy.state('window')
        const $body = cy.$$('body')
        const $div = cy.$$('#nested-find')

        $(win).on('focus', onFocus)
        $body.on('focus', onFocus)
        $div.on('focus', onFocus)

        cy
        .get('#nested-find').click()
        .then(() => {
          expect(onFocus).not.to.be.called
        })
      })

      it('will fire pointerdown event', () => {
        // cy.get('input').eq(1).click()
        // cy.get('input').eq(2).click()
        // cy.get('input').eq(4).click()
        cy.get('textarea:first').click()
        // cy.get('input').eq(3).click()
        cy.get('input:first').click()
        // cy.get('input').eq(1).click()
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs?.push(log)
        })
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.click()
      })

      it('throws when attempting to click multiple elements', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq(`\`cy.click()\` can only be called on a single element. Your subject contained 4 elements. Pass \`{ multiple: true }\` if you want to serially click each element.`)
          expect(err.docsUrl).to.eq('https://on.cypress.io/click')
          done()
        })

        cy.get('.badge-multi').click()
      })

      // This is an instance of an unfixable detached DOM error: .then() is a command, so it sets the subject to a
      // *specific element*, which then gets detached.

      // The error message tells the user exactly how to fix this case.
      it('throws when subject is detached during actionability', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.click()` failed because the page updated while this command was executing.')
          expect(err.message).to.include('You can typically solve this by breaking up a chain.')

          done()
        })

        cy.get('input:first')
        .then(($el) => {
          cy.on('scrolled', () => $el.remove())
        })
        .click()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.click()
      })
      // Array(1).fill().map(()=>

      it('throws when any member of the subject isnt visible', function (done) {
        // sometimes the command will timeout early with
        // Error: coordsHistory must be at least 2 sets of coords
        cy.timeout(300)

        cy.$$('#three-buttons button').show().last().hide()

        cy.on('fail', (err) => {
          const { lastLog, logs } = this
          const logsArr = logs.map((log) => log.get().consoleProps())

          expect(logsArr).to.have.length(4)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.click()` failed because this element is not visible')

          done()
        })

        cy.get('#three-buttons button').click({ multiple: true })
      })

      it('throws when the element has `opacity: 0` but is not visible', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).eq(2)
          expect(err.message).not.to.contain('CSS property: `opacity: 0`')
          expect(err.message).to.contain('`cy.click()` failed because this element')
          expect(err.message).to.contain('is being covered by another element')

          done()
        })

        cy.get('#opacity-0-hidden').click()
      })

      it('throws when element with `opacity: 0` is covering element', function (done) {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))

        $('<span>span on button</span>').css({ opacity: 0, position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block' }).prependTo(cy.$$('body'))

        cy.on('fail', (err) => {
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('is being covered by another element')
          done()
        })

        cy.get('#button-covered-in-span').click()
      })

      it('throws when subject is disabled', function (done) {
        cy.$$('#button').prop('disabled', true)

        cy.on('fail', (err) => {
          // get + click logs
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('`cy.click()` failed because this element is `disabled`:\n')

          done()
        })

        cy.get('#button').click()
      })

      it('throws when a non-descendent element is covering subject', function (done) {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))
        const span = $('<span>span on button</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

        cy.once('fail', (err) => {
          const { lastLog } = this

          // get + click logs
          expect(this.logs.length).eq(2)
          expect(lastLog.get('error')).to.eq(err)

          // there should still be 2 snapshots on error (before + after)
          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[1]).to.be.an('object')
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(err.message).to.include('`cy.click()` failed because this element')
          expect(err.message).to.include('is being covered by another element')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-cannot-be-interacted-with')

          const clickLog = this.logs[1]

          expect(clickLog.get('name')).to.eq('click')

          const console = clickLog.invoke('consoleProps')

          expect(console.props['Tried to Click']).to.eq($btn.get(0))
          expect(console.props['But its Covered By']).to.eq(span.get(0))

          done()
        })

        cy.get('#button-covered-in-span').click()
      })

      it('throws when non-descendent element is covering with fixed position', function (done) {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))
        const span = $('<span>span on button</span>').css({ position: 'fixed', left: 0, top: 0, padding: 20, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          // get + click logs
          expect(this.logs.length).eq(2)
          expect(lastLog.get('error')).to.eq(err)

          // there should still be 2 snapshots on error (before + after)
          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[1]).to.be.an('object')
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(err.message).to.include('`cy.click()` failed because this element')
          expect(err.message).to.include('is being covered by another element')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-cannot-be-interacted-with')

          const console = lastLog.invoke('consoleProps')

          expect(console.props['Tried to Click']).to.eq($btn.get(0))
          expect(console.props['But its Covered By']).to.eq(span.get(0))

          done()
        })

        cy.get('#button-covered-in-span').click()
      })

      it('throws when element is fixed position and being covered', function (done) {
        $('<button>button covered</button>')
        .attr('id', 'button-covered-in-span')
        .css({ position: 'fixed', left: 0, top: 0 })
        .prependTo(cy.$$('body'))

        $('<span>span on button</span>')
        .css({ position: 'fixed', left: 0, top: 0, padding: 20, display: 'inline-block', backgroundColor: 'yellow', zIndex: 10 })
        .prependTo(cy.$$('body'))

        cy.on('fail', (err) => {
          const { lastLog } = this

          // get + click logs
          expect(this.logs.length).eq(2)
          expect(lastLog.get('error')).to.eq(err)

          // there should still be 2 snapshots on error (before + after)
          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[1]).to.be.an('object')
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(err.message).to.include('`cy.click()` failed because this element:')
          expect(err.message).to.include('is being covered by another element:')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-cannot-be-interacted-with')

          done()
        })

        cy.get('#button-covered-in-span').click()
      })

      it('throws when element is hidden and theres no element specifically covering it', (done) => {
        // i cant come up with a way to easily make getElementAtCoordinates
        // return null so we are just forcing it to return null to simulate
        // the element being "hidden" so to speak but still displacing space

        cy.stub(Cypress.dom, 'getElementAtPointFromViewport').returns(null)

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.click()` failed because the center of this element is hidden from view:')
          expect(err.message).to.include('<li>quux</li>')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-cannot-be-interacted-with')

          done()
        })

        cy.get('#overflow-auto-container').contains('quux').click()
      })

      it('throws when attempting to click a <select> element', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 2)
          expect(err.message).to.eq('`cy.click()` cannot be called on a `<select>` element. Use `cy.select()` command instead to change the value.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/select')

          done()
        })

        cy.get('select:first').click()
      })

      it('throws when provided invalid position', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 2)
          expect(err.message).to.eq('Invalid position argument: `foo`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')

          done()
        })

        cy.get('button:first').click('foo')
      })

      it('throws when element animation exceeds timeout', (done) => {
        // force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

        let clicks = 0

        cy.$$('button:first').on('click', () => {
          clicks += 1
        })

        cy.on('fail', (err) => {
          expect(clicks).to.eq(0)
          expect(err.message).to.include('`cy.click()` could not be issued because this element is currently animating:\n')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-is-animating')

          done()
        })

        cy.get('button:first').click()
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(window.chai.AssertionError)

          done()
        })

        cy.get('button:first').click().should('have.class', 'clicked')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 3)

          done()
        })

        cy.get('button:first').click().should('have.class', 'clicked')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })
      })

      it('logs immediately before resolving', (done) => {
        const button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'click') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq(button.get(0))

            done()
          }
        })

        cy.get('button:first').click()
      })

      it('snapshots before clicking', function (done) {
        cy.$$('button:first').click(() => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          done()
        })

        cy.get('button:first').click()
      })

      it('snapshots after clicking', () => {
        cy.get('button:first').click().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('returns only the $el for the element of the subject that was clicked', () => {
        const clicks = []

        // append two buttons
        const button = () => {
          return $(`<button class='clicks'>click</button>`)
        }

        cy.$$('body').append(button()).append(button())

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'click') {
            clicks.push(log)
          }
        })

        cy.get('button.clicks').click({ multiple: true }).then(($buttons) => {
          expect($buttons.length).to.eq(2)
          expect(clicks.length).to.eq(2)

          expect(clicks[1].get('$el').get(0)).to.eq($buttons.last().get(0))
        })
      })

      it('logs only 1 click event', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'click') {
            logs.push(log)
          }
        })

        cy.get('button:first').click().then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('passes in coords', () => {
        cy.get('button').first().click().then(function ($btn) {
          const { lastLog } = this

          $btn.blur() // blur which removes focus styles which would change coords
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

          expect(lastLog.get('coords')).to.deep.eq(fromElWindow)
        })
      })

      it('ends', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'click') {
            logs.push(log)
          }
        })

        cy.get('#three-buttons button').click({ multiple: true }).then(() => {
          _.each(logs, (log) => {
            expect(log.get('state')).to.eq('passed')

            expect(log.get('ended')).to.be.true
          })
        })
      })

      it('logs { multiple: true} options', () => {
        cy.get('span').invoke('slice', 0, 2).click({ multiple: true, timeout: 1000 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{multiple: true, timeout: 1000}')

          expect(lastLog.invoke('consoleProps').props.Options).to.deep.eq({ multiple: true, timeout: 1000 })
        })
      })

      it('#consoleProps', () => {
        cy.get('button').first().click().then(function ($btn) {
          const { lastLog } = this

          const rect = $btn.get(0).getBoundingClientRect()
          const consoleProps = lastLog.invoke('consoleProps')
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

          // this button should be 60 pixels wide
          expect(rect.width).to.eq(60)

          expect(consoleProps.props.Coords.x).to.be.closeTo(fromElWindow.x, 1) // ensure we are within 1
          expect(consoleProps.props.Coords.y).to.be.closeTo(fromElWindow.y, 1) // ensure we are within 1

          expect(consoleProps.props).to.containSubset({
            'Applied To': lastLog.get('$el').get(0),
            'Elements': 1,
          })
        })
      })

      it('#consoleProps actual element clicked', () => {
        const $btn = $('<button>', {
          id: 'button-covered-in-span',
        })
        .prependTo(cy.$$('body'))

        const $span = $('<span>span in button</span>')
        .css({ padding: 5, display: 'inline-block', backgroundColor: 'yellow' })
        .appendTo($btn)

        cy.get('#button-covered-in-span').click().then(function () {
          expect(this.lastLog.invoke('consoleProps').props['Actual Element Clicked']).to.eq($span.get(0))
        })
      })

      it('#consoleProps groups MouseDown', () => {
        cy.$$('input:first').mousedown(_.stubFalse)

        cy.get('input:first').click().then(function () {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.table[1]()).to.containSubset({
            'name': 'Mouse Events',
            'data': [
              {
                'Event Type': 'pointerover',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mouseover',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'pointermove',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mousemove',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'pointerdown',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mousedown',
                'Target Element': { id: 'input' },
                'Prevented Default': true,
                'Stopped Propagation': true,
              },
              {
                'Event Type': 'pointerup',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mouseup',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'click',
                'Target Element': { id: 'input' },
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
            ],
          })
        })
      })

      it('#consoleProps groups MouseUp', () => {
        cy.$$('input:first').mouseup(_.stubFalse)

        cy.get('input:first').click().then(function () {
          expect(this.lastLog.invoke('consoleProps').table[1]().data).to.containSubset([
            {
              'Event Type': 'pointerdown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'mousedown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'pointerup',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'mouseup',
              'Target Element': { id: 'input' },
              'Prevented Default': true,
              'Stopped Propagation': true,
            },
            {
              'Event Type': 'click',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
          ])
        })
      })

      it('#consoleProps groups Click', () => {
        cy.$$('input:first').click(_.stubFalse)

        cy.get('input:first').click().then(function () {
          expect(this.lastLog.invoke('consoleProps').table[1]().data).to.containSubset([
            {
              'Event Type': 'pointerover',
              'Target Element': {},
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mouseover',
              'Target Element': {},
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointermove',
              'Target Element': {},
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mousemove',
              'Target Element': {},
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointerdown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'mousedown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'pointerup',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'mouseup',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
            },
            {
              'Event Type': 'click',
              'Target Element': { id: 'input' },
              'Prevented Default': true,
              'Stopped Propagation': true,
            },
          ])
        })
      })

      it('#consoleProps groups skips mouse move events if no mouse move', () => {
        const btn = cy.$$('span#not-hidden')

        attachMouseClickListeners({ btn })
        attachMouseHoverListeners({ btn })

        cy.get('span#not-hidden').click().click()

        cy.getAll('btn', 'mousemove mouseover').each(shouldBeCalledOnce)
        cy.getAll('btn', 'pointerdown mousedown pointerup mouseup click').each(shouldBeCalledWithCount(2))
        .then(function () {
          const { logs } = this
          const consolePropsArr = logs.map((x) => x.invoke('consoleProps'))

          const lastClickProps = _.filter(consolePropsArr, { name: 'click' })[1]
          const consoleProps = lastClickProps

          expect(_.map(consoleProps.table, (x) => x())).to.containSubset([
            {
              'name': 'Mouse Events',
              'data': [
                {
                  'Event Type': 'pointerdown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mousedown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'pointerup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mouseup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'click',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
              ],
            },
          ])
        })
      })

      it('#consoleProps groups have activated modifiers', () => {
        cy.$$('input:first').click(_.stubFalse)

        cy.get('input:first').type('{ctrl}{shift}', { release: false }).click().then(function () {
          expect(this.lastLog.invoke('consoleProps').table[1]().data).to.containSubset([
            {
              'Event Type': 'pointerdown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': 'ctrl, shift',

            },
            {
              'Event Type': 'mousedown',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': 'ctrl, shift',

            },
            {
              'Event Type': 'pointerup',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': 'ctrl, shift',

            },
            {
              'Event Type': 'mouseup',
              'Target Element': { id: 'input' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': 'ctrl, shift',

            },
            {
              'Event Type': 'click',
              'Target Element': { id: 'input' },
              'Prevented Default': true,
              'Stopped Propagation': true,
              'Active Modifiers': 'ctrl, shift',

            },
          ])
        })
      })

      it('#consoleProps when no click due to detached', () => {
        const $btn = cy.$$('button:first')

        $btn.on('mouseup', function () {
          // synchronously remove this button
          $(this).remove()
        })

        cy.contains('button').click().then(function () {
          expect(this.lastLog.invoke('consoleProps').table[1]().data).to.containSubset([
            {
              'Event Type': 'pointerover',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mouseover',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointermove',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mousemove',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointerdown',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mousedown',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointerup',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mouseup',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'click',
              'Target Element': '⚠️ not fired (element was detached)',
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
          ])
        })
      })

      it('#consoleProps when no click due to move', () => {
        const $btn = cy.$$('button:first')

        // add on overlay on mousedown
        $btn.on('mousedown', () => {
          cy.$$('div#tabindex').css(overlayStyle)
        })

        cy.contains('button').click().then(function () {
          expect(this.lastLog.invoke('consoleProps').table[1]().data).to.containSubset([
            {
              'Event Type': 'pointerdown',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mousedown',
              'Target Element': { id: 'button' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'pointerup',
              'Target Element': { id: 'tabindex' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'mouseup',
              'Target Element': { id: 'tabindex' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
            {
              'Event Type': 'click',
              'Target Element': { id: 'dom' },
              'Prevented Default': null,
              'Stopped Propagation': null,
              'Active Modifiers': null,
            },
          ])
        })
      })

      it('does not fire a click when element has been removed on mouseup', () => {
        const $btn = cy.$$('button:first')

        $btn.on('mouseup', function () {
          // synchronously remove this button
          $(this).remove()
        })

        $btn.on('click', () => {
          fail('should not have gotten click')
        })

        cy.contains('button').click()
      })

      it('logs deltaOptions', () => {
        cy
        .get('button:first').click({ force: true, timeout: 1000 })
        .then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{force: true, timeout: 1000}')

          expect(lastLog.invoke('consoleProps').props.Options).to.deep.eq({ force: true, timeout: 1000 })
        })
      })
    })
  })

  context('#dblclick', () => {
    it('sends a dblclick event', (done) => {
      cy.$$('#button').on('dblclick', () => {
        done()
      })

      cy.get('#button').dblclick()
    })

    it('returns the original subject', () => {
      const $btn = cy.$$('#button')

      cy.get('#button').dblclick().then(($button) => {
        expect($button).to.match($btn)
      })
    })

    it('causes focusable elements to receive focus', () => {
      cy.get(':text:first').dblclick().should('have.focus')
    })

    it('silences errors on unfocusable elements', () => {
      cy.get('div:first').dblclick({ force: true })
    })

    it('causes first focused element to receive blur', () => {
      let blurred = false

      cy.$$('input:first').blur(() => {
        blurred = true
      })

      cy
      .get('input:first').focus()
      .get('input:text:last').dblclick()
      .then(() => {
        expect(blurred).to.be.true
      })
    })

    it('inserts artificial delay of 50ms', () => {
      cy.spy(Promise, 'delay')

      cy.get('#button').click().then(() => {
        expect(Promise.delay).to.be.calledWith(50)
      })
    })

    it('can operate on a jquery collection', () => {
      let dblclicks = 0

      const $buttons = cy.$$('button').slice(0, 2)

      $buttons.dblclick(() => {
        dblclicks += 1

        return false
      })

      // make sure we have more than 1 button
      expect($buttons.length).to.be.gt(1)

      // make sure each button received its dblclick event
      cy.get('button').invoke('slice', 0, 2).dblclick().then(($buttons) => {
        expect($buttons.length).to.eq(dblclicks)
      })
    })

    // TODO: fix this once we implement aborting / restoring / reset
    it.skip('can cancel multiple dblclicks', function (done) {
      let dblclicks = 0

      const spy = this.sandbox.spy(() => {
        this.Cypress.abort()
      })

      // abort after the 3rd dblclick
      const dblclicked = _.after(3, spy)

      const anchors = cy.$$('#sequential-clicks a')

      anchors.dblclick(() => {
        dblclicks += 1

        dblclicked()
      })

      // make sure we have at least 5 anchor links
      expect(anchors.length).to.be.gte(5)

      cy.on('cancel', () => {
        // timeout will get called synchronously
        // again during a click if the click function
        // is called
        const timeout = this.sandbox.spy(cy, '_timeout')

        _.delay(() => {
          // abort should only have been called once
          expect(spy.callCount).to.eq(1)

          // and we should have stopped dblclicking after 3
          expect(dblclicks).to.eq(3)

          expect(timeout.callCount).to.eq(0)

          done()
        }
        , 200)
      })

      cy.get('#sequential-clicks a').dblclick()
    })

    it('serially dblclicks a collection of anchors to the top of the page', () => {
      const throttled = cy.stub().as('clickcount')

      // create a throttled click function
      // which proves we are clicking serially
      const handleClick = cy.stub()
      .callsFake(_.throttle(throttled, 5, { leading: false }))
      .as('handleClick')

      const $anchors = cy.$$('#sequential-clicks a')

      $anchors.on('click', handleClick)
      cy.$$('div#dom').on('click', cy.stub().as('topClick'))
      .on('dblclick', cy.stub().as('topDblclick'))

      // make sure we're clicking multiple $anchors
      expect($anchors.length).to.be.gt(1)

      cy.get('#sequential-clicks a').dblclick({ multiple: true }).then(($els) => {
        expect($els).to.have.length(throttled.callCount)
        cy.get('@topDblclick').should('have.property', 'callCount', $els.length)
      })
    })

    it('serially dblclicks a collection', () => {
      const throttled = cy.stub().as('clickcount')

      // create a throttled click function
      // which proves we are clicking serially
      const handleClick = cy.stub()
      .callsFake(_.throttle(throttled, 5, { leading: false }))
      .as('handleClick')

      const $anchors = cy.$$('#three-buttons button')

      $anchors.on('dblclick', handleClick)

      // make sure we're clicking multiple $anchors
      expect($anchors.length).to.be.gt(1)

      cy.get('#three-buttons button').dblclick({ multiple: true }).then(($els) => {
        expect($els).to.have.length(throttled.callCount)
      })
    })

    it('correctly sets the detail property on mouse events', () => {
      const btn = cy.$$('button:first')

      attachMouseClickListeners({ btn })
      attachMouseDblclickListeners({ btn })
      cy.get('button:first').dblclick()
      cy.getAll('btn', 'mousedown mouseup click').each((spy) => {
        expect(spy.firstCall).calledWithMatch({ detail: 1 })
      })

      cy.getAll('btn', 'mousedown mouseup click').each((spy) => {
        expect(spy.lastCall).to.be.calledWithMatch({ detail: 2 })
      })

      cy.getAll('btn', 'dblclick').each((spy) => {
        expect(spy).to.be.calledOnce
        expect(spy.firstCall).to.be.calledWithMatch({ detail: 2 })
      })

      // pointer events do not set change detail prop
      cy.getAll('btn', 'pointerdown pointerup').each((spy) => {
        expect(spy).to.be.calledWithMatch({ detail: 0 })
      })
    })

    it('sends modifiers', () => {
      const btn = cy.$$('button:first')

      attachMouseClickListeners({ btn })
      attachMouseDblclickListeners({ btn })

      cy.get('input:first').type('{ctrl}{shift}', { release: false })
      cy.get('button:first').dblclick()

      cy.getAll('btn', 'pointerdown mousedown pointerup mouseup click dblclick').each((stub) => {
        expect(stub).to.be.calledWithMatch({
          shiftKey: true,
          ctrlKey: true,
          metaKey: false,
          altKey: false,
        })
      })
    })

    it('increases the timeout delta after each dblclick', () => {
      const count = cy.$$('#three-buttons button').length

      cy.spy(cy, 'timeout')

      cy.get('#three-buttons button').dblclick().then(() => {
        const calls = cy.timeout.getCalls()

        const num = _.filter(calls, (call) => _.isEqual(call.args, [50, true]))

        expect(num.length).to.eq(count)
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.dblclick()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.dblclick()
      })

      it('throws when any member of the subject isnt visible', function (done) {
        cy.timeout(600)
        cy.$$('#three-buttons button').show().last().hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          const logs = _.cloneDeep(this.logs)

          expect(logs).to.have.length(4)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.dblclick()` failed because this element is not visible')

          done()
        })

        cy.get('#three-buttons button').dblclick()
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('logs immediately before resolving', (done) => {
        const $button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($button.get(0))

            done()
          }
        })

        cy.get('button:first').dblclick()
      })

      it('snapshots after clicking', () => {
        cy.get('button:first').dblclick().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots')).to.have.length(2)
          expect(lastLog.get('snapshots')[0]).to.containSubset({ name: 'before' })
          expect(lastLog.get('snapshots')[1]).to.containSubset({ name: 'after' })
        })
      })

      it('returns only the $el for the element of the subject that was dblclicked', () => {
        const dblclicks = []

        // append two buttons
        const $button = () => {
          return $(`<button class='dblclicks'>dblclick</button`)
        }

        cy.$$('body').append($button()).append($button())

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            dblclicks.push(log)
          }
        })

        cy.get('button.dblclicks').dblclick().then(($buttons) => {
          expect($buttons.length).to.eq(2)
          expect(dblclicks.length).to.eq(2)

          expect(dblclicks[1].get('$el').get(0)).to.eq($buttons.last().get(0))
        })
      })

      it('logs only 1 dblclick event', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'dblclick') {
            logs.push(log)
          }
        })

        cy.get('button:first').dblclick().then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('#consoleProps', function () {
        cy.on('log:added', (attrs, log) => {
          this.log = log
        })

        cy.get('button').first().dblclick().then(function () {
          const { lastLog } = this

          const consoleProps = lastLog.invoke('consoleProps')

          expect(consoleProps).to.containSubset({
            name: 'dblclick',
            type: 'command',
            'table': {},
          })

          expect(consoleProps.props).to.containSubset({
            'Applied To': {},
            'Elements': 1,
          })

          const tables = _.map(consoleProps.table, ((x) => x()))

          expect(tables[0]).to.containSubset({
            name: 'Mouse Events',
            data: [
              {
                'Event Type': 'pointerover',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mouseover',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'pointermove',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
              },
              {
                'Event Type': 'mousemove',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
              },

              {
                'Event Type': 'pointerdown',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'mousedown',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'pointerup',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'mouseup',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'click',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'pointerdown',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'mousedown',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'pointerup',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'mouseup',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'click',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
              {
                'Event Type': 'dblclick',
                'Target Element': {},
                'Prevented Default': null,
                'Stopped Propagation': null,
                'Active Modifiers': null,
              },
            ],
          })
        })
      })
    })
  })

  context('#rightclick', () => {
    it('can rightclick', () => {
      const el = cy.$$('button:first')

      attachMouseClickListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'click').each(shouldNotBeCalled)

      cy.getAll('el', 'pointerdown mousedown pointerup mouseup').each((stub) => {
        expect(stub.firstCall.args[0]).to.containSubset({
          button: 2,
          buttons: 2,
          which: 3,
        })
      })

      cy.getAll('el', 'contextmenu').each((stub) => {
        expect(stub.firstCall.args[0]).to.containSubset({
          altKey: false,
          bubbles: true,
          target: el.get(0),
          button: 2,
          buttons: 2,
          cancelable: true,
          data: undefined,
          detail: 0,
          handleObj: { type: 'contextmenu', origType: 'contextmenu', data: undefined },
          relatedTarget: null,
          shiftKey: false,
          type: 'contextmenu',
          view: cy.state('window'),
          which: 3,
        })
      })
    })

    it('can rightclick disabled with force', () => {
      const el = cy.$$('input:first')
      .prop('disabled', true)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('input:first').rightclick({ force: true })

      cy.getAll('el', 'mousedown contextmenu mouseup').each(shouldNotBeCalled)

      // On disabled inputs, pointer events are still fired in chrome, not in firefox or webkit
      cy.getAll('el', 'pointerdown pointerup').each(isFirefox || isWebKit ? shouldNotBeCalled : shouldBeCalled)
    })

    it('rightclick cancel contextmenu', () => {
      const el = cy.$$('button:first')

      // canceling contextmenu prevents the native contextmenu
      // likely we want to call attention to this, since we cannot
      // reproduce the native contextmenu
      el.on('contextmenu', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'click').each(shouldNotBeCalled)
    })

    it('rightclick cancel mousedown', () => {
      const el = cy.$$('button:first')

      el.on('mousedown', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('not.have.focus')

      cy.getAll('el', 'pointerdown mousedown contextmenu pointerup mouseup').each(shouldBeCalled)
      cy.getAll('el', 'focus click').each(shouldNotBeCalled)
    })

    it('rightclick cancel pointerdown', () => {
      const el = cy.$$('button:first')

      el.on('pointerdown', () => false)

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick()

      cy.getAll('el', 'pointerdown pointerup contextmenu').each(shouldBeCalled)
      cy.getAll('el', 'mousedown mouseup').each(shouldNotBeCalled)
    })

    it('rightclick remove el on pointerdown', () => {
      const el = cy.$$('button:first')

      el.on('pointerdown', () => el.get(0).remove())

      attachMouseClickListeners({ el })
      attachFocusListeners({ el })
      attachContextmenuListeners({ el })

      cy.get('button:first').rightclick().should('not.exist')

      cy.getAll('el', 'pointerdown').each(shouldBeCalled)
      cy.getAll('el', 'mousedown mouseup contextmenu pointerup').each(shouldNotBeCalled)
    })

    it('rightclick remove el on mouseover', () => {
      const el = cy.$$('button:first')
      .css({
        transform: 'translateY(-50px)',
      })
      const el2 = cy.$$('div#tabindex')

      el.on('mouseover', () => el.get(0).remove())

      attachMouseClickListeners({ el, el2 })
      attachMouseHoverListeners({ el, el2 })
      attachFocusListeners({ el, el2 })
      attachContextmenuListeners({ el, el2 })

      cy.get('button:first').rightclick().should('not.exist')
      cy.get('div#tabindex').should('have.focus')

      cy.getAll('el', 'pointerover mouseover').each(shouldBeCalledOnce)
      cy.getAll('el', 'pointerdown mousedown pointerup mouseup contextmenu').each(shouldNotBeCalled)
      cy.getAll('el2', 'focus pointerdown pointerup contextmenu').each(shouldBeCalled)
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.rightclick()
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 1)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.rightclick()
      })

      it('throws when any member of the subject isnt visible', function (done) {
        cy.timeout(300)
        cy.$$('#three-buttons button').show().last().hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 4)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.rightclick()` failed because this element is not visible')

          done()
        })

        cy.get('#three-buttons button').rightclick({ multiple: true })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          this.logs.push(log)
        })

        null
      })

      it('logs immediately before resolving', (done) => {
        const $button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq($button.get(0))

            done()
          }
        })

        cy.get('button:first').rightclick()
      })

      it('snapshots after clicking', () => {
        cy.get('button:first').rightclick().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots')).to.have.length(2)
          expect(lastLog.get('snapshots')[0]).to.containSubset({ name: 'before' })
          expect(lastLog.get('snapshots')[1]).to.containSubset({ name: 'after' })
        })
      })

      it('returns only the $el for the element of the subject that was rightclicked', () => {
        const rightclicks = []

        // append two buttons
        const $button = () => {
          return $(`<button class='rightclicks'>rightclick</button`)
        }

        cy.$$('body').append($button()).append($button())

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            rightclicks.push(log)
          }
        })

        cy.get('button.rightclicks').rightclick({ multiple: true }).then(($buttons) => {
          expect($buttons.length).to.eq(2)
          expect(rightclicks.length).to.eq(2)

          expect(rightclicks[1].get('$el').get(0)).to.eq($buttons.last().get(0))
        })
      })

      it('logs only 1 rightclick event', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'rightclick') {
            logs.push(log)
          }
        })

        cy.get('button:first').rightclick().then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('#consoleProps', function () {
        cy.on('log:added', (attrs, log) => {
          this.log = log
        })

        cy.get('button').first().rightclick().then(function ($btn) {
          const { lastLog } = this

          const midpoint = getMidPoint($btn[0])
          const consoleProps = lastLog.invoke('consoleProps')

          expect(consoleProps).to.containSubset({
            name: 'rightclick',
            type: 'command',
            'table': {},
          })

          expect(consoleProps.props).to.containSubset({
            'Applied To': {},
            'Elements': 1,
            'Coords': midpoint,
          })

          const tables = _.map(consoleProps.table, ((x) => x()))

          expect(tables).to.containSubset([
            {
              'name': 'Mouse Events',
              'data': [
                {
                  'Event Type': 'pointerover',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'mouseover',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'pointermove',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },
                {
                  'Event Type': 'mousemove',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                },

                {
                  'Event Type': 'pointerdown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mousedown',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'pointerup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
                {
                  'Event Type': 'mouseup',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },

                {
                  'Event Type': 'contextmenu',
                  'Target Element': {},
                  'Prevented Default': null,
                  'Stopped Propagation': null,
                  'Active Modifiers': null,
                },
              ],
            },
          ])
        })
      })
    })
  })
})

describe('shadow dom', () => {
  beforeEach(() => {
    cy.visit('/fixtures/shadow-dom.html')
  })

  it('composes click events', (done) => {
    const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

    cy.$$('#parent-of-shadow-container-0').on('click', () => {
      done()
    })

    cy
    .get(el)
    .click()
  })

  it('composes dblclick events', (done) => {
    const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

    cy.$$('#parent-of-shadow-container-0').on('dblclick', () => {
      done()
    })

    cy
    .get(el)
    .dblclick()
  })

  it('composes right click events', (done) => {
    const el = cy.$$('#shadow-element-3')[0].shadowRoot.querySelector('p')

    cy.$$('#parent-of-shadow-container-0').on('contextmenu', () => {
      done()
    })

    cy
    .get(el)
    .rightclick()
  })

  it('focuses the correct ancestor when it is outside shadow dom', () => {
    cy.get('.inside-focusable', { includeShadowDom: true }).click()
    cy.get('.focusable').should('be.focused')
  })

  // https://github.com/cypress-io/cypress/issues/7679
  it('does not hang when clicking on custom element', () => {
    // needs some size or it's considered invisible and click will fail its prerequisites
    // so we make it display: block so its getClientRects() contains only a single
    cy.$$('#shadow-element-1').css({ display: 'block' })

    cy.get('#shadow-element-1').click()
  })

  // https://github.com/cypress-io/cypress/issues/18008
  it('does not fail actionability check when element is covered by its shadow host', () => {
    cy.visit('/fixtures/shadow-dom-button.html')

    cy.get('#element').shadow().find('[data-test-id="my-button"]').click()
  })
})

describe('mouse state', () => {
  describe('mouse/pointer events', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/dom.html')
    })

    describe('resets mouse state', () => {
      it('set state', () => {
        cy.get('div.item:first').then(($el) => {
          const mouseenter = cy.stub().as('mouseenter')

          cy.get('body').then(($el) => {
            $el[0].addEventListener('mouseenter', mouseenter)
          }).then(() => {
            const rect = _.pick($el[0].getBoundingClientRect(), 'left', 'top')
            const coords = {
              x: rect.left,
              y: rect.top,
              doc: cy.state('document'),
            }

            cy.devices.mouse.move(coords)
            expect(mouseenter).to.be.calledOnce
            expect(cy.state('mouseCoords')).ok
          })
        })
      })

      it('reset state', () => {
        const mouseenter = cy.stub().as('mouseenter')

        cy.get('body').then(($el) => {
          $el[0].addEventListener('mouseenter', mouseenter)
        }).then(() => {
          expect(cy.state('mouseCoords')).to.eq(undefined)
          expect(mouseenter).to.not.be.called
        })
      // expect(this.mousemove).to.have.been.called
      })
    })

    describe('mouseout', () => {
      it('can move mouse from a div to another div', () => {
        const coordsChrome = {
          clientX: 492,
          clientY: 9,
          layerX: 492,
          layerY: 215,
          pageX: 492,
          pageY: 215,
          screenX: 492,
          screenY: 9,
          x: 492,
          y: 9,
        }

        // TODO: add back assertion on Y values
        const coordsFirefox = {
          clientX: 494,
          clientY: 10,
          // layerX: 492,
          // layerY: 215,
          pageX: 494,
          pageY: 226,
          screenX: 494,
          screenY: 10,
          x: 494,
          y: 10,
        }

        const coordsWebKit = {
          clientX: 500,
          clientY: 10,
          layerX: 500,
          layerY: 226,
          pageX: 500,
          pageY: 226,
          screenX: 500,
          screenY: 10,
          x: 500,
          y: 10,
        }

        let coords

        switch (Cypress.browser.family) {
          case 'firefox':
            coords = coordsFirefox
            break
          case 'webkit':
            coords = coordsWebKit
            break
          default:
            coords = coordsChrome
            break
        }

        const mouseout = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: true,
            button: 0,
            buttons: 0,
            cancelable: true,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'mouseout',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('mouseout', mouseout)
        }).as('mouseout')

        const mouseleave = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: false,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'mouseleave',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('mouseleave', mouseleave)
        }).as('mouseleave')

        const pointerout = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: true,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'pointerout',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('pointerout', pointerout)
        }).as('pointerout')

        const pointerleave = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: false,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[0],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[1],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[0],
            // not in firefox?
            // toElement: cy.$$('div.item')[1],
            type: 'pointerleave',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('pointerleave', pointerleave)
        }).as('pointerleave')

        const mouseover = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: true,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'mouseover',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('mouseover', mouseover)
        }).as('mouseover')

        const mouseenter = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: false,
            button: 0,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'mouseenter',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('mouseenter', mouseenter)
        }).as('mouseenter')

        const pointerover = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: true,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: true,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'pointerover',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('pointerover', pointerover)
        }).as('pointerover')

        const pointerenter = cy.stub().callsFake((e) => {
          const exp = {
            altKey: false,
            bubbles: false,
            button: -1,
            buttons: 0,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            ctrlKey: false,
            currentTarget: cy.$$('div.item')[1],
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            // fromElement: cy.$$('div.item')[0],
            isTrusted: false,
            metaKey: false,
            movementX: 0,
            movementY: 0,
            // offsetX: 484,
            // offsetY: 27,
            relatedTarget: cy.$$('div.item')[0],
            returnValue: true,
            shiftKey: false,
            target: cy.$$('div.item')[1],
            // not in Firefox
            // toElement: cy.$$('div.item')[1],
            type: 'pointerenter',
            view: cy.state('window'),
            // which: 0,
          }

          expect(_.pick(e, _.keys(exp))).to.containSubset(exp)
          _.each(coords, (v, key) => expect(e[key], key).closeTo(v, 1))

          e.target.removeEventListener('pointerenter', pointerenter)
        }).as('pointerenter')

        cy.get('div.item').eq(0)
        .should(($el) => {
          $el[0].addEventListener('mouseout', mouseout)
          $el[0].addEventListener('mouseleave', mouseleave)
          $el[0].addEventListener('pointerout', pointerout)
          $el[0].addEventListener('pointerleave', pointerleave)
        })
        .click()
        .then(() => {
          expect(cy.state('mouseCoords')).ok
        })

        cy.get('div.item').eq(1).should(($el) => {
          $el[0].addEventListener('mouseover', mouseover)
          $el[0].addEventListener('mouseenter', mouseenter)
          $el[0].addEventListener('pointerover', pointerover)
          $el[0].addEventListener('pointerenter', pointerenter)
        })
        .click()

        Cypress.Promise.delay(5000)
        .then(() => {
          expect(mouseout).to.be.calledOnce
          expect(mouseleave).to.be.calledOnce
          expect(pointerout).to.be.calledOnce
          expect(pointerleave).to.be.calledOnce
          expect(mouseover).to.be.calledOnce
          expect(mouseover).to.be.calledOnce
          expect(mouseenter).to.be.calledOnce
          expect(pointerover).to.be.calledOnce
          expect(pointerenter).to.be.calledOnce
        })
      })
    })
  })

  describe('more mouse state', () => {
    beforeEach(() => {
      cy.visit('http://localhost:3500/fixtures/issue-2956.html')
    })

    describe('mouseleave mouseenter animations', () => {
      it('sends mouseenter/mouseleave event', () => {
        cy.get('#outer').click()
        cy.get('#inner').should('be.visible')
        cy.get('body').click()
        cy.get('#inner').should('not.be.visible')
      })

      it('will respect changes to dom in event handlers', () => {
        const els = {
          sq4: cy.$$('#sq4'),
          outer: cy.$$('#outer'),
          input: cy.$$('input:first'),
        }

        attachListeners(['mouseenter', 'mouseexit'])

        attachMouseClickListeners(els)
        attachMouseHoverListeners(els)

        cy.get('#sq4').click()
        cy.get('#outer').click()

        cy.getAll('sq4', 'mouseover mousedown mouseup click').each(shouldBeCalledWithCount(2))

        cy.getAll('sq4', 'mouseout').each(shouldBeCalledOnce)

        cy.getAll('outer', 'mousedown mouseup click').each(shouldNotBeCalled)

        cy.getAll('outer', 'mouseover mouseout').each(shouldBeCalledOnce)

        cy.get('input:first').click().should('not.have.focus')

        cy.getAll('input', 'mouseover mouseout').each(shouldBeCalledOnce)

        cy.getAll('input', 'mousedown mouseup click').each(shouldNotBeCalled)
      })

      it('can click on a recursively moving element', () => {
        const sq6 = cy.$$('#sq6')

        /*
        * the square moves back-forth on mouseleave/mouseenter
        * so:
        * - move phase, mouseover sent to sq, sq leaves
        * - before mousedown events, move phase, sq returns, mousedown sent to sq
        * - before mouseup events, move phase, mouseover sent to sq, sq leaves, mouseup sent to body
        * - before click events, move events sent, sq returns, click sent to sq
        */
        attachListeners(['mouseover'])({ sq6 })
        attachMouseClickListeners({ sq6 })

        cy.get('#sq6')
        .click()

        cy.getAll('sq6', 'mousedown pointerdown').each(shouldBeCalledOnce)
        cy.getAll('sq6', 'mouseover').each(shouldBeCalledWithCount(2))
        cy.getAll('sq6', 'click').each(shouldNotBeCalled)
      })
    })

    it('handles disabled attr', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      attachMouseHoverListeners({ btn })
      attachMouseClickListeners({ btn })

      const onAction = cy.stub().callsFake(() => {
        btn.attr('disabled', true)
      })

      btn.on('pointerover', onAction)

      cy.get('#btn').click()

      cy.getAll('btn', 'pointerover pointerenter').each(shouldBeCalledOnce)

      // On disabled inputs, pointer events are still fired in chrome, not in firefox or webkit
      cy.getAll('btn', 'pointerdown pointerup').each(isFirefox || isWebKit ? shouldNotBeCalled : shouldBeCalledOnce)
      cy.getAll('btn', 'mouseover mouseenter').each(isFirefox || isWebKit || isChromium116OrLater ? shouldBeCalled : shouldNotBeCalled)
      cy.getAll('btn', 'mousedown mouseup click').each(shouldNotBeCalled)
    })

    it('handles disabled attr added on mousedown', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      attachMouseHoverListeners({ btn })
      attachMouseClickListeners({ btn })

      btn.on('mousedown', () => {
        btn.attr('disabled', true)
      })

      cy.get('#btn').click()

      cy.getAll('btn', 'pointerdown mousedown').each(shouldBeCalledOnce)

      // On disabled inputs, pointer events are still fired in chrome, not in firefox or webkit
      cy.getAll('btn', 'pointerup').each(isFirefox || isWebKit ? shouldNotBeCalled : shouldBeCalledOnce)

      cy.getAll('btn', 'mouseup click').each(shouldNotBeCalled)
    })

    it('can click new element after mousemove sequence', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      const cover = cy.$$(/*html*/`<div id='cover'></div>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: 50,
        width: 300,
      })
      .appendTo(btn.parent())

      cover.on('mousemove', () => {
        cover.hide()
      })

      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      cy.get('#cover').click()

      cy.getAll('cover', 'pointerdown mousedown pointerup mouseup click').each(shouldNotBeCalled)

      cy.getAll('btn', 'pointerdown mousedown mouseup pointerup click').each(shouldBeCalledOnce)
    })

    it('can click new element after mousemove sequence [disabled]', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      const cover = cy.$$(/*html*/`<div id='cover'></div>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: 50,
        width: 300,
      })
      .appendTo(btn.parent())

      cover.on('mousemove', () => {
        cover.hide()
      })

      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      btn.attr('disabled', true)

      cover.on('mousemove', () => {
        cover.hide()
      })

      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      cy.get('#cover').click()

      cy.getAll('btn', 'mousedown mouseup click').each(shouldNotBeCalled)

      // On disabled inputs, pointer events are still fired in chrome, not in firefox or webkit
      cy.getAll('btn', 'pointerdown pointerup').each(isFirefox || isWebKit ? shouldNotBeCalled : shouldBeCalled)
    })

    it('can target new element after mousedown sequence', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      const cover = cy.$$(/*html*/`<div id='cover'></div>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: 50,
        width: 300,
      })
      .appendTo(btn.parent())

      cover.on('mousedown', () => {
        cover.hide()
      })

      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      btn.on('mouseup', () => {
        btn.attr('disabled', true)
      })

      cy.get('#cover').click()

      cy.getAll('btn', 'mouseup pointerup').each((stub) => {
        expect(stub).to.be.calledOnce
      })
    })

    it('can target new element after mouseup sequence', () => {
      const btn = cy.$$(/*html*/`<button id='btn'>#btn</button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      const cover = cy.$$(/*html*/`<div id='cover'>#cover</div>`).css({
        backgroundColor: 'salmon',
        position: 'relative',
        height: 50,
        width: 300,
      })
      .appendTo(btn.parent())

      const onEvent = cy.stub().callsFake(() => {
        cover.hide()
      })

      cover.on('mouseup', onEvent)

      attachFocusListeners({ btn, cover })
      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      btn.on('mouseup', () => {
        btn.attr('disabled', true)
      })

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cy.get('#cover').click()

      cy.getAll('cover', 'mousedown mouseup click mouseout mouseleave').each(shouldBeCalledOnce)
      cy.getAll('cover', 'focus').each(shouldNotBeCalled)
      cy.getAll('btn', 'mouseover mouseenter').each(shouldBeCalled)
    })

    it('responds to changes in move handlers', () => {
      const btn = cy.$$(/*html*/`<button id='btn'></button>`)
      .css({
        float: 'left',
        display: 'block',
        width: 250,
        height: 30,
      })
      .appendTo(cy.$$('body'))

      const cover = cy.$$(/*html*/`<div id='cover'></div>`).css({
        backgroundColor: 'blue',
        position: 'relative',
        height: 50,
        width: 300,
      })
      .appendTo(btn.parent())

      const onEvent = cy.stub().callsFake(() => {
        cover.hide()
      })

      // uncomment to manually test
      // cy.wrap(onEvent).should('be.called')
      cover.on('mouseover', onEvent)

      attachFocusListeners({ btn, cover })
      attachMouseHoverListeners({ btn, cover })
      attachMouseClickListeners({ btn, cover })

      cy.get('#cover').click()
      // cy.wrap(null).should(() => expect(clicked).ok)

      cy.getAll('cover', 'mousedown mouseup click focus').each(shouldNotBeCalled)
      cy.getAll('btn', 'pointerdown mousedown mouseup pointerup click').each(shouldBeCalledOnce)
    })
  })

  describe('user experience', () => {
    beforeEach(() => {
      cy.visit('/fixtures/dom.html').then(() => {
        if (Cypress.config('hideRunnerUi')) {
          throw new Error('hideRunnerUi is true, but should be false')
        }
      })
    })

    // https://github.com/cypress-io/cypress/issues/4347
    it('can render element highlight inside iframe', () => {
      cy.get('iframe:first')
      .should(($iframe) => {
        // wait for iframe to load
        expect($iframe.first().contents().find('body').html()).ok
      })
      .then(($iframe) => {
        // cypress does not wrap this as a DOM element (does not wrap in jquery)
        cy.wrap($iframe.first().contents().find('body'))
      })
      .within(() => {
        cy.get('a#hashchange')
        .click()
      })
      .then(($body) => {
        expect($body[0].ownerDocument.defaultView.location.hash).eq('#hashchange')
      })

      clickCommandLog('click')
      .then(() => {
        cy.get('.__cypress-highlight').then(($target) => {
          const targetRect = $target[0].getBoundingClientRect()
          const iframeRect = cy.$$('iframe')[0].getBoundingClientRect()

          expect(targetRect.top).gt(iframeRect.top)
          expect(targetRect.bottom).lt(iframeRect.bottom)
          expect(targetRect.left).gt(iframeRect.left)
          expect(targetRect.right).lt(iframeRect.right)
        })
      })
    })

    it('can print table of keys on click', () => {
      const spyTableName = cy.spy(top.console, 'group')
      const spyTableData = cy.spy(top.console, 'table')

      cy.get('input:first').click()

      clickCommandLog('click')
      .then(() => {
        expect(spyTableName).calledWith('Mouse Events')
        expect(spyTableData).calledOnce
      })
    })

    it('can print table of keys on dblclick', () => {
      const spyTableName = cy.spy(top.console, 'group')
      const spyTableData = cy.spy(top.console, 'table')

      cy.get('input:first').dblclick()

      clickCommandLog('click')
      .then(() => {
        expect(spyTableName).calledWith('Mouse Events')
        expect(spyTableData).calledOnce
        expect(spyTableData.lastCall.args[0]).property('8').includes({ 'Event Type': 'click' })
        expect(spyTableData.lastCall.args[0]).property('13').includes({ 'Event Type': 'click' })
        expect(spyTableData.lastCall.args[0]).property('14').includes({ 'Event Type': 'dblclick' })
      })
    })

    it('can print table of keys on rightclick', () => {
      const spyTableName = cy.spy(top.console, 'group')
      const spyTableData = cy.spy(top.console, 'table')

      cy.get('input:first').rightclick()

      clickCommandLog('click')
      .then(() => {
        expect(spyTableName).calledWith('Mouse Events')
        expect(spyTableData).calledOnce
        expect(spyTableData.lastCall.args[0]).property('8').includes({ 'Event Type': 'contextmenu' })
      })
    })
  })
})
