/* eslint-disable
    brace-style,
    no-undef,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const $ = Cypress.$.bind(Cypress)
const {
  _,
} = Cypress

describe('src/cy/commands/actions/trigger', () => {
  before(() => {
    return cy
    .visit('/fixtures/dom.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    const doc = cy.state('document')

    return $(doc.body).empty().html(this.body)
  })

  context('#trigger', () => {
    it('sends event', (done) => {
      const $btn = cy.$$('#button')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        const obj = _.pick(e.originalEvent, 'bubbles', 'cancelable', 'target', 'type')

        expect(obj).to.deep.eq({
          bubbles: true,
          cancelable: true,
          target: $btn.get(0),
          type: 'mouseover',
        })

        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        return done()
      })

      return cy.get('#button').trigger('mouseover')
    })

    it('bubbles up event by default', (done) => {
      return cy
      .window()
      .then((win) => {
        $(win).one('mouseover', () => {
          return done()
        })

        return cy.get('#button').trigger('mouseover')
      })
    })

    it('does not bubble up event if specified', (done) => {
      return cy
      .window()
      .then((win) => {
        const $win = $(win)

        $win.on('keydown', (e) => {
          const evt = JSON.stringify(e.originalEvent, [
            'bubbles', 'cancelable', 'isTrusted', 'type', 'clientX', 'clientY',
          ])

          return done(new Error(`event should not have bubbled up to window listener: ${evt}`))
        })

        return cy
        .get('#button')
        .trigger('keydown', {
          bubbles: false,
        })
        .then(() => {
          $win.off('keydown')

          return done()
        })
      })
    })

    it('sends through event options, overriding defaults', (done) => {
      let options = {
        clientX: 42,
        clientY: 24,
        pageX: 420,
        pageY: 240,
        foo: 'foo',
      }

      cy.$$('button:first').on('mouseover', (e) => {
        const eventOptions = _.pick(e.originalEvent, 'clientX', 'clientY', 'pageX', 'pageY', 'foo')

        // options gets mutated by the command :(
        options = _.pick(options, 'clientX', 'clientY', 'pageX', 'pageY', 'foo')
        expect(eventOptions).to.eql(options)

        return done()
      })

      return cy.get('button:first').trigger('mouseover', options)
    })

    it('records correct clientX when el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)

        return done()
      })

      return cy.get('#scrolledBtn').trigger('mouseover')
    })

    it('records correct clientY when el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        return done()
      })

      return cy.get('#scrolledBtn').trigger('mouseover')
    })

    // NOTE: flaky about 50% of the time in Firefox...
    // temporarily skipping for now, but this needs
    // to be reenabled after launch once we have time
    // to look at the underlying failure cause
    it.skip('records correct pageX and pageY el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(e.pageX).to.be.closeTo(win.scrollX + e.clientX, 1)
        expect(e.pageY).to.be.closeTo(win.scrollY + e.clientY, 1)

        return done()
      })

      return cy.get('#scrolledBtn').trigger('mouseover')
    })

    it('does not change the subject', () => {
      const $input = cy.$$('input:first')

      return cy.get('input:first').trigger('keydown').then(($el) => {
        expect($el.get(0)).to.eq($input.get(0))
      })
    })

    it('can trigger events on the window', () => {
      let expected = false

      const win = cy.state('window')

      $(win).on('scroll', (e) => {
        return expected = true
      })

      return cy
      .window().trigger('scroll')
      .then(() => {
        expect(expected).to.be.true
      })
    })

    it('can trigger custom events on the window', () => {
      let expected = false

      const win = cy.state('window')

      $(win).on('foo', (e) => {
        expect(e.detail).to.deep.eq({ foo: 'bar' })
        expected = true
      })

      return cy
      .window().trigger('foo', {
        detail: { foo: 'bar' },
      })
      .then(() => {
        expect(expected).to.be.true
      })
    })

    it('can trigger events on the document', () => {
      let expected = false

      const doc = cy.state('document')

      $(doc).on('dragover', () => {
        return expected = true
      })

      return cy.document().trigger('dragover').then(() => {
        expect(expected).to.be.true
      })
    })

    it('can handle window w/length > 1 as a subject', () => {
      return cy.window().should('have.length.gt', 1)
      .trigger('click')
    })

    describe('actionability', () => {
      it('can trigger on elements which are hidden until scrolled within parent container', () => {
        return cy.get('#overflow-auto-container').contains('quux').trigger('mousedown')
      })

      it('can trigger on readonly inputs', () => {
        return cy.get('#readonly-attr').trigger('mousedown')
      })

      it('does not scroll when being forced', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        return cy
        .get('button:last').trigger('mouseover', { force: true })
        .then(() => {
          expect(scrolled).to.be.empty
        })
      })

      it('can force trigger on hidden elements', () => {
        return cy.get('button:first').invoke('hide').trigger('tap', { force: true })
      })

      it('can force trigger on disabled elements', () => {
        return cy.get('input:first').invoke('prop', 'disabled', true).trigger('tap', { force: true })
      })

      it('can forcibly trigger even when being covered by another element', () => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))
        const span = $('<span>span on button</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

        const scrolled = []
        let retried = false
        let tapped = false

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        cy.on('command:retry', ($el, type) => {
          return retried = true
        })

        $btn.on('tap', () => {
          return tapped = true
        })

        return cy.get('#button-covered-in-span').trigger('tap', { force: true }).then(() => {
          expect(scrolled).to.be.empty
          expect(retried).to.be.false

          expect(tapped).to.be.true
        })
      })

      it('eventually triggers when covered up', () => {
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
        let retried = false

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        cy.on('command:retry', _.after(3, () => {
          $span.hide()
          retried = true
        }))

        return cy.get('#button-covered-in-span').trigger('mousedown').then(() => {
          expect(retried).to.be.true

          // - element scrollIntoView
          // - element scrollIntoView (retry animation coords)
          // - element scrollIntoView (retry covered)
          // - element scrollIntoView (retry covered)
          // - window
          expect(scrolled).to.deep.eq(['element', 'element', 'element', 'element'])
        })
      })

      it('issues event to descendent', () => {
        let mouseovers = 0

        const $btn = $('<div>', {
          id: 'div-covered-in-span',
        })
        .css({ padding: 10, margin: 0, border: 'solid 1px #000' })
        .prependTo(cy.$$('body'))

        const $span = $('<span>span covering div</span>')
        .css({ padding: 5, display: 'block', backgroundColor: 'yellow' })
        .appendTo($btn)

        $btn.on('mouseover', () => {
          return mouseovers += 1
        })

        $span.on('mouseover', () => {
          return mouseovers += 1
        })

        return cy
        .get('#div-covered-in-span').trigger('mouseover')
        .should(() => {
          expect(mouseovers).to.eq(2)
        })
      })

      it('scrolls the window past a fixed position element when being covered', () => {
        const $btn = $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .appendTo(cy.$$('#fixed-nav-test'))

        const $nav = $('<nav>nav on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        return cy.get('#button-covered-in-nav').trigger('mouseover').then(() => // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window
        {
          expect(scrolled).to.deep.eq(['element', 'element', 'window'])
        })
      })

      it('scrolls the window past two fixed positioned elements when being covered', () => {
        const $btn = $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .appendTo(cy.$$('#fixed-nav-test'))

        const $nav = $('<nav>nav on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        const $nav2 = $('<nav>nav2 on button</nav>').css({
          position: 'fixed',
          left: 0,
          top: 40,
          padding: 20,
          backgroundColor: 'red',
          zIndex: 1,
        }).prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        return cy.get('#button-covered-in-nav').trigger('mouseover').then(() => // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window (nav1)
        // - window (nav2)
        {
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

        const $btn = $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .css({
          marginTop: 500,
          // marginLeft: 500
          marginBottom: 500,
        })
        .appendTo($container)

        const $nav = $('<nav>nav on button</nav>')
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
          return scrolled.push(type)
        })

        return cy.get('#button-covered-in-nav').trigger('mouseover').then(() => // - element scrollIntoView
        // - element scrollIntoView (retry animation coords)
        // - window
        // - container
        {
          expect(scrolled).to.deep.eq(['element', 'element', 'window', 'container'])
        })
      })

      it('waits until element becomes visible', () => {
        const $btn = cy.$$('#button').hide()

        let retried = false

        cy.on('command:retry', _.after(3, () => {
          $btn.show()
          retried = true
        }))

        return cy.get('#button').trigger('mouseover').then(() => {
          expect(retried).to.be.true
        })
      })

      it('waits until element is no longer disabled', () => {
        const $btn = cy.$$('#button').prop('disabled', true)

        let retried = false
        let mouseovers = 0

        $btn.on('mouseover', () => {
          return mouseovers += 1
        })

        cy.on('command:retry', _.after(3, () => {
          $btn.prop('disabled', false)
          retried = true
        }))

        return cy.get('#button').trigger('mouseover').then(() => {
          expect(mouseovers).to.eq(1)

          expect(retried).to.be.true
        })
      })

      it('waits until element stops animating', () => {
        let retries = 0

        cy.on('command:retry', (obj) => {
          return retries += 1
        })

        cy.stub(cy, 'ensureElementIsNotAnimating')
        .throws(new Error('animating!'))
        .onThirdCall().returns()

        return cy.get('button:first').trigger('mouseover').then(() => {
          // - retry animation coords
          // - retry animation
          // - retry animation
          expect(retries).to.eq(3)

          expect(cy.ensureElementIsNotAnimating).to.be.calledThrice
        })
      })

      it('does not throw when waiting for animations is disabled', () => {
        cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))
        Cypress.config('waitForAnimations', false)

        return cy.get('button:first').trigger('mouseover').then(() => {
          expect(cy.ensureElementIsNotAnimating).not.to.be.called
        })
      })

      it('does not throw when turning off waitForAnimations in options', () => {
        cy.stub(cy, 'ensureElementIsNotAnimating').throws(new Error('animating!'))

        return cy.get('button:first').trigger('tap', { waitForAnimations: false }).then(() => {
          expect(cy.ensureElementIsNotAnimating).not.to.be.called
        })
      })

      it('passes options.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
        const $btn = cy.$$('button:first')

        const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, 'ensureElementIsNotAnimating')

        return cy.get('button:first').trigger('tap', { animationDistanceThreshold: 1000 }).then(() => {
          const {
            args,
          } = cy.ensureElementIsNotAnimating.firstCall

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])

          expect(args[2]).to.eq(1000)
        })
      })

      it('passes config.animationDistanceThreshold to cy.ensureElementIsNotAnimating', () => {
        const animationDistanceThreshold = Cypress.config('animationDistanceThreshold')

        const $btn = cy.$$('button:first')

        const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

        cy.spy(cy, 'ensureElementIsNotAnimating')

        return cy.get('button:first').trigger('mouseover').then(() => {
          const {
            args,
          } = cy.ensureElementIsNotAnimating.firstCall

          expect(args[1]).to.deep.eq([fromElWindow, fromElWindow])

          expect(args[2]).to.eq(animationDistanceThreshold)
        })
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        const $btn = cy.$$('button:first')

        cy.on('command:retry', _.once(() => {
          return $btn.addClass('moused-over')
        }))

        return cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over').then(function () {
          const {
            lastLog,
          } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('position argument', () => {
      it('can trigger event on center by default', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)

          return done()
        }

        $button.one('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover')
      })

      it('can trigger event on center', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(108)
          expect(e.clientY).to.equal(50)

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'center')
      })

      it('can trigger event on topLeft', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))
        const onMouseover = function (e) {
          expect(e.clientX).to.equal(8)
          // NOTE: firefox leaves 1px on top of element on scroll, so add top offset
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'topLeft')
      })

      it('can trigger event on topRight', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'topRight')
      })

      it('can trigger event on bottomLeft', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(8)
          expect(e.clientY).to.equal(99)

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'bottomLeft')
      })

      it('can trigger event on bottomRight', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'bottomRight')
      })

      it('can pass options along with position', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)
          expect(e.clientY).to.equal(99)

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 'bottomRight', { bubbles: false })
      })
    })

    describe('relative coordinate arguments', () => {
      it('can specify x and y', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 75, 78)
      })

      it('can pass options along with x, y', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))

          return done()
        }

        $button.on('mouseover', onMouseover)

        return cy.get('button:first').trigger('mouseover', 75, 78, { bubbles: false })
      })
    })

    describe('errors', () => {
      beforeEach(function () {
        Cypress.config('defaultCommandTimeout', 100)

        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('throws when eventName is not a string', () => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('cy.trigger() can only be called on a single element. Your subject contained 15 elements.')

          return done()
        })

        return cy.get('button:first').trigger('cy.trigger() must be passed a non-empty string as its 1st argument. You passed: \'undefined\'.')
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          return done()
        })

        return cy.trigger('mouseover')
      })

      it('throws when attempting to trigger multiple elements', (done) => {
        const num = cy.$$('button').length

        cy.on('fail', (err) => {
          expect(err.message).to.eq(`cy.trigger() can only be called on a single element. Your subject contained ${num} elements.`)

          return done()
        })

        return cy.get('button').trigger('mouseover')
      })

      it('throws when subject is not in the document', (done) => {
        let mouseover = 0

        const checkbox = cy.$$(':checkbox:first').on('mouseover', (e) => {
          mouseover += 1
          checkbox.remove()

          return false
        })

        cy.on('fail', (err) => {
          expect(mouseover).to.eq(1)
          expect(err.message).to.include('cy.trigger() failed because this element')

          return done()
        })

        return cy.get(':checkbox:first').trigger('mouseover').trigger('mouseover')
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(2)
          expect(lastLog.get('error')).to.eq(err)

          return done()
        })

        return cy.wrap({}).trigger('mouseover')
      })

      it('throws when the subject isnt visible', function (done) {
        const $btn = cy.$$('#button:first').hide()

        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(this.logs.length).to.eq(2)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('cy.trigger() failed because this element is not visible')

          return done()
        })

        return cy.get('button:first').trigger('mouseover')
      })

      it('throws when subject is disabled', function (done) {
        const $btn = cy.$$('#button').prop('disabled', true)

        cy.on('fail', (err) => {
          // get + click logs
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('cy.trigger() failed because this element is disabled:\n')

          return done()
        })

        return cy.get('#button').trigger('mouseover')
      })

      it('throws when provided invalid position', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).to.eq(2)
          expect(err.message).to.eq('Invalid position argument: \'foo\'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')

          return done()
        })

        return cy.get('button:first').trigger('mouseover', 'foo')
      })

      it('throws when element animation exceeds timeout', (done) => {
        // force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

        let clicks = 0

        cy.$$('button:first').on('tap', () => {
          return clicks += 1
        })

        cy.on('fail', (err) => {
          expect(clicks).to.eq(0)
          expect(err.message).to.include('cy.trigger() could not be issued because this element is currently animating:\n')

          return done()
        })

        return cy.get('button:first').trigger('tap')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const {
            lastLog,
          } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          return done()
        })

        return cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          expect(this.logs.length).to.eq(3)

          return done()
        })

        return cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over')
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
        })

        return null
      })

      it('logs immediately before resolving', (done) => {
        const button = cy.$$('button:first')

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'trigger') {
            expect(log.get('state')).to.eq('pending')
            expect(log.get('$el').get(0)).to.eq(button.get(0))

            return done()
          }
        })

        return cy.get('button:first').trigger('mouseover')
      })

      it('snapshots before triggering', function (done) {
        cy.$$('button:first').on('mouseover', () => {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          return done()
        })

        return cy.get('button:first').trigger('mouseover')
      })

      it('snapshots after triggering', () => {
        return cy.get('button:first').trigger('mouseover').then(function ($button) {
          const {
            lastLog,
          } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')

          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('logs only 1 event', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'trigger') {
            return logs.push(log)
          }
        })

        return cy.get('button:first').trigger('mouseover').then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('passes in coords', () => {
        return cy.get('button:first').trigger('mouseover').then(function ($btn) {
          const {
            lastLog,
          } = this

          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

          expect(lastLog.get('coords')).to.deep.eq(fromElWindow, 'x', 'y')
        })
      })

      it('#consoleProps', function () {
        return cy.get('button:first').trigger('mouseover').then(($button) => {
          const consoleProps = this.lastLog.invoke('consoleProps')
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($button)
          const logCoords = this.lastLog.get('coords')
          const eventOptions = consoleProps['Event options']

          expect(logCoords.x).to.be.closeTo(fromElWindow.x, 1) // ensure we are within 1
          expect(logCoords.y).to.be.closeTo(fromElWindow.y, 1) // ensure we are within 1
          expect(consoleProps.Command).to.eq('trigger')
          expect(eventOptions.bubbles).to.be.true
          expect(eventOptions.cancelable).to.be.true
          expect(eventOptions.clientX).to.be.be.a('number')
          expect(eventOptions.clientY).to.be.be.a('number')
          expect(eventOptions.pageX).to.be.be.a('number')
          expect(eventOptions.pageY).to.be.be.a('number')
          expect(eventOptions.screenX).to.be.be.a('number').and.eq(eventOptions.clientX)

          expect(eventOptions.screenY).to.be.be.a('number').and.eq(eventOptions.clientY)
        })
      })
    })
  })
})
