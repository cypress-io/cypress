const { assertLogLength } = require('../../../support/utils')
const { _, $ } = Cypress

describe('src/cy/commands/actions/trigger', () => {
  beforeEach(function () {
    cy.visit('/fixtures/dom.html')
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

        done()
      })

      cy.get('#button').trigger('mouseover')
    })

    it('bubbles up event by default', (done) => {
      cy
      .window()
      .then((win) => {
        $(win).one('mouseover', () => {
          done()
        })

        cy.get('#button').trigger('mouseover')
      })
    })

    it('does not bubble up event if specified', (done) => {
      cy
      .window()
      .then((win) => {
        const $win = $(win)

        $win.on('keydown', (e) => {
          const evt = JSON.stringify(e.originalEvent, [
            'bubbles', 'cancelable', 'isTrusted', 'type', 'clientX', 'clientY',
          ])

          done(new Error(`event should not have bubbled up to window listener: ${evt}`))
        })

        cy
        .get('#button')
        .trigger('keydown', {
          bubbles: false,
        })
        .then(() => {
          $win.off('keydown')

          done()
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

        expect(eventOptions).to.eql(options)

        done()
      })

      cy.get('button:first').trigger('mouseover', options)
    })

    it('records correct clientX when el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))
      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientX).to.be.closeTo(fromElViewport.x, 1)

        done()
      })

      cy.get('#scrolledBtn').trigger('mouseover')
    })

    it('records correct clientY when el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))
      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        const { fromElViewport } = Cypress.dom.getElementCoordinatesByPosition($btn)

        expect(win.scrollX).to.be.gt(0)
        expect(e.clientY).to.be.closeTo(fromElViewport.y, 1)

        done()
      })

      cy.get('#scrolledBtn').trigger('mouseover')
    })

    // NOTE: flaky about 50% of the time in Firefox...
    // temporarily skipping for now, but this needs
    // to be reenabled after launch once we have time
    // to look at the underlying failure cause
    it.skip('records correct pageX and pageY el scrolled', (done) => {
      const $btn = $('<button id=\'scrolledBtn\' style=\'position: absolute; top: 1600px; left: 1200px; width: 100px;\'>foo</button>').appendTo(cy.$$('body'))

      const win = cy.state('window')

      $btn.on('mouseover', (e) => {
        expect(e.pageX).to.be.closeTo(win.scrollX + e.clientX, 1)
        expect(e.pageY).to.be.closeTo(win.scrollY + e.clientY, 1)

        done()
      })

      cy.get('#scrolledBtn').trigger('mouseover')
    })

    it('does not change the subject', () => {
      const $input = cy.$$('input:first')

      cy.get('input:first').trigger('keydown').then(($el) => {
        expect($el.get(0)).to.eq($input.get(0))
      })
    })

    it('requeries the dom while waiting for actionability', () => {
      const $input = cy.$$('input:first').attr('disabled', true)

      cy.on('command:retry', () => {
        // Replace the input with a copy of itself, to ensure trigger is requerying the DOM
        $input.replaceWith($input[0].outerHTML)
        cy.$$('input:first').attr('disabled', false)
      })

      cy.get('input:first').trigger('keydown')
    })

    it('can trigger events on the window', () => {
      let expected = false

      const win = cy.state('window')

      $(win).on('scroll', (e) => {
        expected = true
      })

      cy
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

      cy
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
        expected = true
      })

      cy.document().trigger('dragover').then(() => {
        expect(expected).to.be.true
      })
    })

    it('can handle window w/length > 1 as a subject', () => {
      cy.window().should('have.length.gt', 1).trigger('click')
    })

    // https://github.com/cypress-io/cypress/issues/3686
    it('view should be AUT window', (done) => {
      cy.window().then((win) => {
        cy.get('input:first').then((jQueryElement) => {
          let elem = jQueryElement.get(0)

          elem.addEventListener('mousedown', (event) => {
            expect(event.view).to.eql(win)
            done()
          })
        })
      })

      cy.get('input:first').trigger('mousedown', {
        eventConstructor: 'MouseEvent',
        button: 0,
        shiftKey: false,
        ctrlKey: false,
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

      it('can trigger on elements which are hidden until scrolled within parent container', () => {
        cy.get('#overflow-auto-container').contains('quux').trigger('mousedown')
      })

      it('can trigger on elements with `opacity: 0`', () => {
        cy.get('#opacity-0').trigger('mousedown')
      })

      it('can trigger on elements with parents that have `opacity: 0`', () => {
        cy.get('#opacity-0-parent').trigger('mousedown')
      })

      it('can trigger on readonly inputs', () => {
        cy.get('#readonly-attr').trigger('mousedown')
      })

      it('does not scroll when being forced', () => {
        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        cy
        .get('button:last').trigger('mouseover', { force: true })
        .then(() => {
          expect(scrolled).to.be.empty
        })
      })

      it('can force trigger on hidden elements', () => {
        cy.get('button:first').invoke('hide').trigger('tap', { force: true })
      })

      it('can force trigger on disabled elements', () => {
        cy.get('input:first').invoke('prop', 'disabled', true).trigger('tap', { force: true })
      })

      it('can forcibly trigger even when being covered by another element', () => {
        const $btn = $('<button>button covered</button>').attr('id', 'button-covered-in-span').prependTo(cy.$$('body'))

        $('<span>span on button</span>').css({ position: 'absolute', left: $btn.offset().left, top: $btn.offset().top, padding: 5, display: 'inline-block', backgroundColor: 'yellow' }).prependTo(cy.$$('body'))

        const scrolled = []
        let tapped = false

        cy.on('scrolled', ($el, type) => {
          scrolled.push(type)
        })

        $btn.on('tap', () => {
          tapped = true
        })

        cy.get('#button-covered-in-span').trigger('tap', { force: true }).then(() => {
          expect(scrolled).to.be.empty
          expect(retries).to.eq(0)
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
        })
        .prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        cy.on('command:retry', _.after(3, () => {
          $span.hide()
        }))

        cy.get('#button-covered-in-span').trigger('mousedown').then(() => {
          expect(retries).to.be.gt(1)

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
          mouseovers += 1
        })

        $span.on('mouseover', () => {
          mouseovers += 1
        })

        cy
        .get('#div-covered-in-span').trigger('mouseover')
        .should(() => {
          expect(mouseovers).to.eq(2)
        })
      })

      it('issues event to descendent when waitForAnimations is false', { waitForAnimations: false }, () => {
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
          mouseovers += 1
        })

        $span.on('mouseover', () => {
          mouseovers += 1
        })

        cy
        .get('#div-covered-in-span').trigger('mouseover')
        .should(() => {
          expect(mouseovers).to.eq(2)
        })
      })

      it('scrolls the window past a fixed position element when being covered', () => {
        $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .appendTo(cy.$$('#fixed-nav-test'))

        $('<nav>nav on button</nav>')
        .css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        })
        .prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        cy.get('#button-covered-in-nav').trigger('mouseover').then(() => {
          // - element scrollIntoView
          // - element scrollIntoView (retry animation coords)
          // - window
          expect(scrolled).to.deep.eq(['element', 'element', 'window'])
        })
      })

      it('scrolls the window past two fixed positioned elements when being covered', () => {
        $('<button>button covered</button>')
        .attr('id', 'button-covered-in-nav')
        .appendTo(cy.$$('#fixed-nav-test'))

        $('<nav>nav on button</nav>')
        .css({
          position: 'fixed',
          left: 0,
          top: 0,
          padding: 20,
          backgroundColor: 'yellow',
          zIndex: 1,
        })
        .prependTo(cy.$$('body'))

        $('<nav>nav2 on button</nav>')
        .css({
          position: 'fixed',
          left: 0,
          top: 40,
          padding: 20,
          backgroundColor: 'red',
          zIndex: 1,
        })
        .prependTo(cy.$$('body'))

        const scrolled = []

        cy.on('scrolled', ($el, type) => {
          return scrolled.push(type)
        })

        cy.get('#button-covered-in-nav').trigger('mouseover').then(() => {
          // - element scrollIntoView
          // - element scrollIntoView (retry animation coords)
          // - window (nav1)
          // - window (nav2)
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

        cy.get('#button-covered-in-nav').trigger('mouseover').then(() => {
          // - element scrollIntoView
          // - element scrollIntoView (retry animation coords)
          // - window
          // - container
          expect(scrolled).to.deep.eq(['element', 'element', 'window', 'container'])
        })
      })

      it('waits until element becomes visible', () => {
        const $btn = cy.$$('#button').hide()

        cy.on('command:retry', _.after(3, () => {
          $btn.show()
        }))

        cy.get('#button').trigger('mouseover').then(() => {
          expect(retries).to.be.gt(1)
        })
      })

      it('waits until element is no longer disabled', () => {
        const $btn = cy.$$('#button').prop('disabled', true)

        let retried = false
        let mouseovers = 0

        $btn.on('mouseover', () => {
          mouseovers += 1
        })

        cy.on('command:retry', _.after(3, () => {
          $btn.prop('disabled', false)
          retried = true
        }))

        cy.get('#button').trigger('mouseover').then(() => {
          expect(mouseovers).to.eq(1)
          expect(retried).to.be.true
        })
      })

      it('waits until element stops animating', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).trigger('mouseover').then(() => {
          expect(retries).to.be.gte(1)
        })
      })

      it('does not wait when waiting for animations is disabled', {
        waitForAnimations: false,
      }, () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).trigger('mouseover').then(() => {
          expect(retries).to.eq(0)
        })
      })

      it('does not wait when turning off waitForAnimations in options', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).trigger('tap', { waitForAnimations: false }).then(() => {
          expect(retries).to.eq(0)
        })
      })

      it('passes options.animationDistanceThreshold to ensureElementIsNotAnimating', () => {
        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).trigger('tap', { animationDistanceThreshold: 1000 }).then(($btn) => {
          // One retry, because $actionability always waits for two sets of points to determine if an element is animating.
          expect(retries).to.eq(1)
        })
      })

      it('passes config.animationDistanceThreshold to ensureElementIsNotAnimating', () => {
        let old = Cypress.config('animationDistanceThreshold')

        Cypress.config('animationDistanceThreshold', 1000)

        cy.get('button:first').then(($btn) => $btn.animate({ width: '30em' }, 100)).trigger('mouseover').then(($btn) => {
          // One retry, because $actionability always waits for two sets of points to determine if an element is animating.
          try {
            expect(retries).to.eq(1)
          } finally {
            Cypress.config('animationDistanceThreshold', old)
          }
        })
      })

      it('can specify scrollBehavior in options', () => {
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover', { scrollBehavior: 'bottom' })

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
        })
      })

      it('does not scroll when scrollBehavior is false in options', () => {
        cy.scrollTo('top')
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover', { scrollBehavior: false })

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).not.to.be.called
        })
      })

      it('can specify scrollBehavior bottom in config', { scrollBehavior: 'bottom' }, () => {
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover')

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'end' })
        })
      })

      it('can specify scrollBehavior center in config', { scrollBehavior: 'center' }, () => {
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover')

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'center' })
        })
      })

      it('can specify scrollBehavior nearest in config', { scrollBehavior: 'nearest' }, () => {
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover')

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'nearest' })
        })
      })

      it('does not scroll when scrollBehavior is false in config', { scrollBehavior: false }, () => {
        cy.scrollTo('top')
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover')

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).not.to.be.called
        })
      })

      it('calls scrollIntoView by default', () => {
        cy.scrollTo('top')
        cy.get('button:first').then((el) => {
          cy.spy(el[0], 'scrollIntoView')
        })

        cy.get('button:first').trigger('mouseover')

        cy.get('button:first').then((el) => {
          expect(el[0].scrollIntoView).to.be.calledWith({ block: 'start' })
        })
      })

      // https://github.com/cypress-io/cypress/issues/4233
      it('can check an element behind a sticky header', () => {
        cy.viewport(400, 400)
        cy.visit('./fixtures/sticky-header.html')
        cy.get('p').trigger('mouseover')
      })

      it('errors when scrollBehavior is false and element is out of view and is clicked', (done) => {
        cy.scrollTo('top')

        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.trigger()` failed because the center of this element is hidden from view')
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

        cy.get('button:first').trigger('mouseover', { scrollBehavior: false, timeout: 200 })
      })
    })

    describe('assertion verification', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
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
          $btn.addClass('moused-over')
        }))

        cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('position argument', () => {
      it('can trigger event on center by default', (done) => {
        const height = 100
        const $button = cy.$$('<button />').css({ width: 200, height }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(108)

          // NOTE: in firefox, the element's top value can vary depending on how the AUT is scaled.
          // So we factor the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal((height / 2) + Math.floor(e.target.getBoundingClientRect().top))

          done()
        }

        $button.one('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover')
      })

      it('can trigger event on center', (done) => {
        const height = 100
        const $button = cy.$$('<button />').css({ width: 200, height }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(108)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal((height / 2) + Math.floor(e.target.getBoundingClientRect().top))

          done()
        }

        $button.on('mouseover', onMouseover)
        cy.get('button:first').trigger('mouseover', 'center')
      })

      it('can trigger event on topLeft', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))
        const onMouseover = function (e) {
          expect(e.clientX).to.equal(8)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 'topLeft')
      })

      it('can trigger event on topRight', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal(0 + Math.ceil(e.target.getBoundingClientRect().top))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 'topRight')
      })

      it('can trigger event on bottomLeft', (done) => {
        const height = 100
        const $button = cy.$$('<button />').css({ width: 200, height }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(8)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal(height + (Math.floor(e.target.getBoundingClientRect().top) - 1))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 'bottomLeft')
      })

      it('can trigger event on bottomRight', (done) => {
        const height = 100
        const $button = cy.$$('<button />').css({ width: 200, height }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal(height + (Math.floor(e.target.getBoundingClientRect().top) - 1))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 'bottomRight')
      })

      it('can pass options along with position', (done) => {
        const height = 100
        const $button = cy.$$('<button />').css({ width: 200, height }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(207)

          // NOTE: in firefox, the element's top value varies depending on how the AUT is scaled. So we factor
          // the top value into our assertion in a manner similar to the coordinate calculations.
          expect(e.clientY).to.equal(height + (Math.floor(e.target.getBoundingClientRect().top) - 1))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 'bottomRight', { bubbles: false })
      })
    })

    describe('relative coordinate arguments', () => {
      it('can specify x and y', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 75, 78)
      })

      it('can pass options along with x, y', (done) => {
        const $button = cy.$$('<button />').css({ width: 200, height: 100 }).prependTo(cy.$$('body'))

        const onMouseover = function (e) {
          expect(e.clientX).to.equal(83)
          expect(e.clientY).to.equal(78 + Math.ceil(e.target.getBoundingClientRect().top))

          done()
        }

        $button.on('mouseover', onMouseover)

        cy.get('button:first').trigger('mouseover', 75, 78, { bubbles: false })
      })
    })

    // https://github.com/cypress-io/cypress/issues/5650
    describe('dispatches correct Event objects', () => {
      it('should trigger KeyboardEvent with .trigger inside Cypress event listener', (done) => {
        cy.window().then((win) => {
          cy.get('input:first').then((jQueryElement) => {
            let elemHtml = jQueryElement.get(0)

            elemHtml.addEventListener('keydown', (event) => {
              expect(event instanceof win['KeyboardEvent']).to.be.true
              done()
            })
          })
        })

        cy.get('input:first').trigger('keydown', {
          eventConstructor: 'KeyboardEvent',
          keyCode: 65,
          which: 65,
          shiftKey: false,
          ctrlKey: false,
        })
      })

      it('should trigger KeyboardEvent with .trigger inside html script event listener', () => {
        cy.visit('fixtures/issue-5650.html')

        cy.get('#test-input').trigger('keydown', {
          eventConstructor: 'KeyboardEvent',
          keyCode: 65,
          which: 65,
          shiftKey: false,
          ctrlKey: false,
        })

        cy.get('#result').contains('isKeyboardEvent: true')
      })

      it('should trigger MouseEvent with .trigger inside Cypress event listener', (done) => {
        cy.window().then((win) => {
          cy.get('input:first').then((jQueryElement) => {
            let elem = jQueryElement.get(0)

            elem.addEventListener('mousedown', (event) => {
              expect(event instanceof win['MouseEvent']).to.be.true
              done()
            })
          })
        })

        cy.get('input:first').trigger('mousedown', {
          eventConstructor: 'MouseEvent',
          button: 0,
          shiftKey: false,
          ctrlKey: false,
        })
      })

      it('should trigger MouseEvent with .trigger inside html script event listener', () => {
        cy.visit('fixtures/issue-5650.html')
        cy.get('#test-input').trigger('mousedown', {
          eventConstructor: 'MouseEvent',
          button: 0,
          shiftKey: false,
          ctrlKey: false,
        })

        cy.get('#result').contains('isMouseEvent: true')
      })
    })

    describe('errors', {
      defaultCommandTimeout: 100,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      // TODO: trigger() doesn't throw an error now.
      it.skip('throws when eventName is not a string', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.trigger()` can only be called on a single element. Your subject contained 15 elements.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/trigger')

          done()
        })

        cy.get('button:first').trigger('`cy.trigger()` must be passed a non-empty string as its 1st argument. You passed: \'undefined\'.')
      })

      it('throws when not a dom subject', (done) => {
        cy.on('fail', () => {
          done()
        })

        cy.trigger('mouseover')
      })

      it('throws when attempting to trigger multiple elements', (done) => {
        const num = cy.$$('button').length

        cy.on('fail', (err) => {
          expect(err.message).to.eq(`\`cy.trigger()\` can only be called on a single element. Your subject contained ${num} elements.`)
          expect(err.docsUrl).to.eq('https://on.cypress.io/trigger')

          done()
        })

        cy.get('button').trigger('mouseover')
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
          expect(err.message).to.include('`cy.trigger()` failed because the page')

          done()
        })

        cy.get(':checkbox:first').trigger('mouseover').trigger('mouseover')
      })

      it('logs once when not dom subject', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 2)
          expect(lastLog.get('error')).to.eq(err)

          done()
        })

        cy.wrap({}).trigger('mouseover')
      })

      it('throws when the subject isnt visible', function (done) {
        cy.$$('#button:first').hide()

        cy.on('fail', (err) => {
          const { lastLog } = this

          assertLogLength(this.logs, 2)
          expect(lastLog.get('error')).to.eq(err)
          expect(err.message).to.include('`cy.trigger()` failed because this element is not visible')

          done()
        })

        cy.get('button:first').trigger('mouseover')
      })

      it('throws when the element has `opacity: 0` but is not visible', function (done) {
        cy.on('fail', (err) => {
          expect(this.logs.length).eq(2)
          expect(err.message).not.to.contain('CSS property: `opacity: 0`')
          expect(err.message).to.contain('`cy.trigger()` failed because this element')
          expect(err.message).to.contain('is being covered by another element')

          done()
        })

        cy.get('#opacity-0-hidden').trigger('mouseover')
      })

      it('throws when subject is disabled', function (done) {
        cy.$$('#button').prop('disabled', true)

        cy.on('fail', (err) => {
          // get + click logs
          expect(this.logs.length).eq(2)
          expect(err.message).to.include('`cy.trigger()` failed because this element is `disabled`:\n')

          done()
        })

        cy.get('#button').trigger('mouseover')
      })

      it('throws when provided invalid position', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 2)
          expect(err.message).to.eq('Invalid position argument: `foo`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')

          done()
        })

        cy.get('button:first').trigger('mouseover', 'foo')
      })

      it('throws when provided invalid event type', function (done) {
        cy.on('fail', (err) => {
          assertLogLength(this.logs, 2)
          expect(err.message).to.eq('Timed out retrying after 100ms: `cy.trigger()` `eventConstructor` option must be a valid event (e.g. \'MouseEvent\', \'KeyboardEvent\'). You passed: `FooEvent`')

          done()
        })

        cy.get('button:first').trigger('mouseover', {
          eventConstructor: 'FooEvent',
        })
      })

      it('throws when element animation exceeds timeout', (done) => {
        // force the animation calculation to think we moving at a huge distance ;-)
        cy.stub(Cypress.utils, 'getDistanceBetween').returns(100000)

        let clicks = 0

        cy.$$('button:first').on('tap', () => {
          clicks += 1
        })

        cy.on('fail', (err) => {
          expect(clicks).to.eq(0)
          expect(err.message).to.include('`cy.trigger()` could not be issued because this element is currently animating:\n')
          expect(err.docsUrl).to.eq('https://on.cypress.io/element-is-animating')

          done()
        })

        cy.get('button:first').trigger('tap')
      })

      it('eventually fails the assertion', function (done) {
        cy.on('fail', (err) => {
          const { lastLog } = this

          expect(err.message).to.include(lastLog.get('error').message)
          expect(err.message).not.to.include('undefined')
          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('failed')
          expect(lastLog.get('error')).to.be.an.instanceof(chai.AssertionError)

          done()
        })

        cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over')
      })

      it('does not log an additional log on failure', function (done) {
        cy.on('fail', () => {
          assertLogLength(this.logs, 3)

          done()
        })

        cy.get('button:first').trigger('mouseover').should('have.class', 'moused-over')
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

            done()
          }
        })

        cy.get('button:first').trigger('mouseover')
      })

      it('snapshots before triggering', function (done) {
        cy.$$('button:first').on('mouseover', () => {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0].name).to.eq('before')
          expect(lastLog.get('snapshots')[0].body).to.be.an('object')

          done()
        })

        cy.get('button:first').trigger('mouseover')
      })

      it('snapshots after triggering', () => {
        cy.get('button:first').trigger('mouseover').then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(2)
          expect(lastLog.get('snapshots')[1].name).to.eq('after')
          expect(lastLog.get('snapshots')[1].body).to.be.an('object')
        })
      })

      it('logs only 1 event', () => {
        const logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'trigger') {
            logs.push(log)
          }
        })

        cy.get('button:first').trigger('mouseover').then(() => {
          expect(logs.length).to.eq(1)
        })
      })

      it('passes in coords', () => {
        cy.get('button:first').trigger('mouseover').then(function ($btn) {
          const { lastLog } = this
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($btn)

          expect(lastLog.get('coords')).to.deep.eq(fromElWindow, 'x', 'y')
        })
      })

      it('#consoleProps', function () {
        cy.get('button:first').trigger('mouseover').then(($button) => {
          const consoleProps = this.lastLog.invoke('consoleProps')
          const { fromElWindow } = Cypress.dom.getElementCoordinatesByPosition($button)
          const logCoords = this.lastLog.get('coords')
          const eventOptions = consoleProps.props['Event options']

          expect(logCoords.x).to.be.closeTo(fromElWindow.x, 1) // ensure we are within 1
          expect(logCoords.y).to.be.closeTo(fromElWindow.y, 1) // ensure we are within 1
          expect(consoleProps.name).to.eq('trigger')
          expect(consoleProps.type).to.eq('command')
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
