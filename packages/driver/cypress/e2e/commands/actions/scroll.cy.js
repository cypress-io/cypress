const { _, $ } = Cypress

describe('src/cy/commands/actions/scroll', () => {
  beforeEach(() => {
    cy.visit('/fixtures/scrolling.html')

    cy.viewport(600, 200)
  })

  context('#scrollTo', () => {
    beforeEach(function () {
      this.win = cy.state('window')
      this.scrollVert = cy.$$('#scroll-to-vertical')
      this.scrollHoriz = cy.$$('#scroll-to-horizontal')
      this.scrollBoth = cy.$$('#scroll-to-both')

      // reset the scrollable containers back
      // to furthest left and top
      this.win.scrollTop = 0
      this.win.scrollLeft = 0

      this.scrollVert.scrollTop = 0
      this.scrollVert.scrollLeft = 0

      this.scrollHoriz.scrollTop = 0
      this.scrollHoriz.scrollLeft = 0

      this.scrollBoth.scrollTop = 0
      this.scrollBoth.scrollLeft = 0

      // width or height of DOM in pixels
      this.scrollableContainerWidthHeight = 500
      this.elementWidthHeight = 100
      this.scrollBarWidthHeight = 15

      // divide by 2 to get the center
      // browsers round up the pixel value so we need to round it
      this.halfScroll = Math.round((this.scrollableContainerWidthHeight - this.elementWidthHeight) / 2)
      this.fullScroll = Math.round(this.scrollableContainerWidthHeight - this.elementWidthHeight)
    })

    describe('subject', () => {
      it('is window by default', () => {
        cy.scrollTo('125px').then(function (win2) {
          expect(this.win).to.eq(win2)
        })
      })

      it('is DOM', () => {
        cy.get('#scroll-to-vertical').scrollTo('125px').then(function ($el) {
          expect($el.get(0)).to.eq(this.scrollVert.get(0))
        })
      })

      it('can use window', () => {
        cy.window().scrollTo('10px').then((win) => {
          // Firefox doesn't round this number like other browsers
          // So we round in the test to get consistent results here
          expect(Math.round(win.scrollX)).to.eq(10)
        })
      })

      it('can handle window w/length > 1 as a subject', () => {
        cy.visit('/fixtures/dom.html')

        cy.window().should('have.length.gt', 1)
        .scrollTo('10px')
      })
    })

    describe('x axis only', () => {
      it('scrolls x axis to num px', function () {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-horizontal').scrollTo(300).then(function () {
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(this.scrollHoriz.get(0).scrollLeft).to.eq(300)
        })
      })

      it('scrolls x axis to px', function () {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-horizontal').scrollTo('125px').then(function () {
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(this.scrollHoriz.get(0).scrollLeft).to.eq(125)
        })
      })

      it('scrolls x axis by % of scrollable height', function () {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-horizontal').scrollTo('50%').then(function () {
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
          // since there is no veritical scrollbar to take into account
          // this is just half of the basic width
          expect(this.scrollHoriz.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })
    })

    describe('position arguments', () => {
      it('scrolls x/y axis to topLeft', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('topLeft').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)
        })
      })

      it('scrolls x/y axis to top', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('top').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })

      it('scrolls x/y axis to topRight', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('topRight').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.fullScroll)
        })
      })

      it('scrolls x/y axis to left', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('left').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(this.halfScroll)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)
        })
      })

      it('scrolls x/y axis to center', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('center').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(this.halfScroll)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })

      it('scrolls x/y axis to right', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('right').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(this.halfScroll)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq((this.fullScroll))
        })
      })

      it('scrolls x/y axis to bottomLeft', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('bottomLeft').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((this.fullScroll))
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)
        })
      })

      it('scrolls x/y axis to bottom', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('bottom').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((this.fullScroll))
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })

      it('scrolls x/y axis to bottomRight', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('bottomRight').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq((this.fullScroll))
          expect(this.scrollBoth.get(0).scrollLeft).to.eq((this.fullScroll))
        })
      })
    })

    describe('scroll both axis', () => {
      it('scrolls both x and y axis num of px', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo(300, 150).then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(300)
        })
      })

      it('scrolls x to 0 and y num of px', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo(0, 150).then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)
        })
      })

      it('scrolls x num of px and y to 0 ', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo(150, 0).then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(150)
        })
      })

      it('scrolls both x and y axis of px', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('300px', '150px').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(150)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(300)
        })
      })

      it('scrolls both x and y axis of percentage', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('50%', '50%').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(this.halfScroll)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })

      it('scrolls x to 0 and y percentage', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('0%', '50%').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(this.halfScroll)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)
        })
      })

      it('scrolls x to percentage and y to 0', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        cy.get('#scroll-to-both').scrollTo('50%', '0%').then(function () {
          expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(this.halfScroll)
        })
      })
    })

    describe('scrolls with options', () => {
      it('calls jQuery scroll to', () => {
        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px').then(() => {
          expect(scrollTo).to.be.calledWith({ left: '25px', top: 0 })
        })
      })

      it('sets duration to 0 by default', () => {
        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px').then(() => {
          expect(scrollTo).to.be.calledWithMatch({}, { duration: 0 })
        })
      })

      it('sets axis to correct xy', () => {
        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px', '80px').then(() => {
          expect(scrollTo).to.be.calledWithMatch({}, { axis: 'xy' })
        })
      })

      it('scrolling resolves after a set duration', function () {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0)

        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-horizontal').scrollTo('125px', { duration: 500 }).then(function () {
          expect(scrollTo).to.be.calledWithMatch({}, { duration: 500 })
          expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
          expect(this.scrollHoriz.get(0).scrollLeft).to.eq(125)
        })
      })

      it('accepts duration string option', () => {
        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px', { duration: '500' }).then(() => {
          expect(scrollTo.args[0][1].duration).to.eq('500')
        })
      })

      it('has easing set to swing by default', () => {
        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px').then(() => {
          expect(scrollTo.args[0][1].easing).to.eq('swing')
        })
      })

      it('scrolling resolves after easing', function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

        const scrollTo = cy.spy($.fn, 'scrollTo')

        cy.get('#scroll-to-both').scrollTo('25px', '50px', { easing: 'linear' }).then(function () {
          expect(scrollTo).to.be.calledWithMatch({}, { easing: 'linear' })
          expect(this.scrollBoth.get(0).scrollTop).to.eq(50)
          expect(this.scrollBoth.get(0).scrollLeft).to.eq(25)
        })
      })

      it('retries until element is scrollable', () => {
        let $container = cy.$$('#nonscroll-becomes-scrollable')

        expect($container.get(0).scrollTop).to.eq(0)
        expect($container.get(0).scrollLeft).to.eq(0)

        let retried = false

        cy.on('command:retry', _.after(2, () => {
          // Replacing the element with itself to ensure that .scrollTo() is requerying the DOM
          // as necessary
          $container.replaceWith($container[0].outerHTML)
          $container = cy.$$('#nonscroll-becomes-scrollable')

          $container.css('overflow', 'scroll')
          retried = true
        }))

        cy.get('#nonscroll-becomes-scrollable').scrollTo(500, 300).then(() => {
          expect(retried).to.be.true
          expect($container.get(0).scrollTop).to.eq(300)
          expect($container.get(0).scrollLeft).to.eq(500)
        })
      })

      // https://github.com/cypress-io/cypress/issues/1924
      it('skips scrollability check', () => {
        cy.get('button:first').scrollTo('bottom', { ensureScrollable: false }).then(() => {
          cy.stub(Cypress.ensure, 'isScrollable')
          expect(Cypress.ensure.isScrollable).not.to.be.called
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

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$('#scroll-into-view-horizontal').addClass('scrolled')
        }))

        cy
        .get('#scroll-into-view-horizontal')
        .scrollTo('right')
        .should('have.class', 'scrolled').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')

          expect(lastLog.get('ended')).to.be.true
        })
      })

      it('waits until the subject is scrollable', () => {
        cy.stub(Cypress.ensure, 'isScrollable')
        .onFirstCall().throws(new Error())

        cy.on('command:retry', () => {
          return Cypress.ensure.isScrollable.returns()
        })

        cy
        .get('#scroll-into-view-horizontal')
        .scrollTo('right').then(() => {
          expect(Cypress.ensure.isScrollable).to.be.calledTwice
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })

        return null
      })

      it('throws when subject isn\'t scrollable', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.scrollTo()` failed because this element is not scrollable:')
          expect(err.message).to.include(`\`<button>button</button>\``)
          expect(err.message).to.include('Make sure you\'re targeting the correct element or use `{ensureScrollable: false}` to disable the scrollable check.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

          done()
        })

        cy.get('button:first').scrollTo('bottom')
      })

      context('subject errors', () => {
        it('throws when not passed DOM element as subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` failed because it requires a DOM element or window.')
            expect(err.message).to.include('{foo: bar}')
            expect(err.message).to.include('> `cy.noop()`')

            done()
          })

          cy.noop({ foo: 'bar' }).scrollTo('250px')
        })

        it('throws if scrollable container is multiple elements', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` can only be used to scroll 1 element, you tried to scroll 2 elements.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('button').scrollTo('500px')
        })

        it('throws if subject disappears while waiting for scrollability', (done) => {
          cy.on('command:retry', () => cy.$$('#nonscroll-becomes-scrollable').remove())

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` failed because the page updated')
            done()
          })

          cy.get('#nonscroll-becomes-scrollable').scrollTo(500, 300)
        })
      })

      context('argument errors', () => {
        it('throws if no args passed', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.scrollTo()
        })

        it('throws if NaN', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, NaN`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('#scroll-to-both').scrollTo(25, 0 / 0)
        })

        it('throws if Infinity', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` must be called with a valid `position`. It can be a string, number or object. Your position was: `25, Infinity`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('#scroll-to-both').scrollTo(25, 10 / 0)
        })

        it('throws if unrecognized position', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('Invalid position argument: `botom`. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')

            done()
          })

          cy.get('#scroll-to-both').scrollTo('botom')
        })
      })

      context('option errors', () => {
        it('throws if duration is not a number or valid string', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('#scroll-to-both').scrollTo('25px', { duration: 'foo' })
        })

        it('throws if unrecognized easing', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` must be called with a valid `easing`. Your easing was: `flower`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('#scroll-to-both').scrollTo('25px', { easing: 'flower' })
        })

        it('throws if ensureScrollable is not a boolean', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollTo()` `ensureScrollable` option must be a boolean. You passed: `force`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollto')

            done()
          })

          cy.get('button:first').scrollTo('bottom', { ensureScrollable: 'force' })
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#scroll-to-both').scrollTo(25, 0, { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('scrollTo')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#scroll-to-both').scrollTo(25, 0, { log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('scrollTo')

          expect(hiddenLog.get('name'), 'log name').to.eq('scrollTo')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('logs out scrollTo', () => {
        cy.get('#scroll-to-both').scrollTo(25).then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('scrollTo')
        })
      })

      it('passes in $el if child command', () => {
        cy.get('#scroll-to-both').scrollTo(25).then(function ($container) {
          const { lastLog } = this

          expect(lastLog.get('$el').get(0)).to.eq($container.get(0))
        })
      })

      it('passes undefined in $el if parent command', () => {
        cy.scrollTo(25).then(function () {
          const { lastLog } = this

          expect(lastLog.get('$el')).to.be.undefined
        })
      })

      it('logs duration options', () => {
        cy.get('#scroll-to-both').scrollTo(25, { duration: 1 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('25, 0, {duration: 1}')
        })
      })

      it('logs easing options', () => {
        cy.get('#scroll-to-both').scrollTo(25, { easing: 'linear' }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('25, 0, {easing: linear}')
        })
      })

      it('snapshots immediately', () => {
        cy.get('#scroll-to-both').scrollTo(25, { duration: 1 }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)

          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.get('#scroll-to-both').scrollTo(25, { duration: 1 }).then(function ($container) {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.name).to.eq('scrollTo')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props.X).to.eq(25)
          expect(consoleProps.props.Y).to.eq(0)
          expect(consoleProps.props.Options).to.eq('{duration: 1}')

          expect(consoleProps.props['Scrolled Element']).to.eq($container.get(0))
        })
      })
    })
  })

  context('#scrollIntoView', () => {
    beforeEach(function () {
      this.win = cy.state('window')
      this.scrollVert = cy.$$('#scroll-into-view-vertical')
      this.scrollHoriz = cy.$$('#scroll-into-view-horizontal')
      this.scrollBoth = cy.$$('#scroll-into-view-both')

      // reset the scrollable containers back
      // to furthest left and top
      this.win.scrollTo(0, 0)

      this.scrollVert.scrollTop(0)
      this.scrollVert.scrollLeft(0)

      this.scrollHoriz.scrollTop(0)
      this.scrollHoriz.scrollLeft(0)

      this.scrollBoth.scrollTop(0)
      this.scrollBoth.scrollLeft(0)
    })

    it('does not change the subject', () => {
      const div = cy.$$('#scroll-into-view-vertical div')

      cy.get('#scroll-into-view-vertical div').scrollIntoView().then(($div) => {
        expect($div).to.match(div)
      })
    })

    it('scrolls x axis of window to element', function () {
      expect(this.win.scrollY).to.eq(0)
      expect(this.win.scrollX).to.eq(0)

      cy.get('#scroll-into-view-win-horizontal div').scrollIntoView()

      cy.window().then((win) => {
        expect(win.scrollY).to.eq(0)
        expect(win.scrollX).not.to.eq(0)
      })
    })

    it('scrolls y axis of window to element', function () {
      expect(this.win.scrollY).to.eq(0)
      expect(this.win.scrollX).to.eq(0)

      cy.get('#scroll-into-view-win-vertical div').scrollIntoView()

      cy.window().then((win) => {
        expect(win.pageYOffset).not.to.eq(0)
        expect(Math.floor(win.pageXOffset)).closeTo(200, 2)
      })
    })

    it('scrolls both axes of window to element', function () {
      expect(this.win.scrollY).to.eq(0)
      expect(this.win.scrollX).to.eq(0)

      cy.get('#scroll-into-view-win-both div').scrollIntoView()

      cy.window().then((win) => {
        expect(win.scrollY).not.to.eq(0)
        expect(win.scrollX).not.to.eq(0)
      })
    })

    it('scrolls x axis of container to element', function () {
      expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
      expect(this.scrollHoriz.get(0).scrollLeft).to.eq(0)

      cy.get('#scroll-into-view-horizontal h5').scrollIntoView().then(function () {
        expect(this.scrollHoriz.get(0).scrollTop).to.eq(0)
        expect(this.scrollHoriz.get(0).scrollLeft).to.eq(300)
      })
    })

    it('scrolls y axis of container to element', function () {
      expect(this.scrollVert.get(0).scrollTop).to.eq(0)
      expect(this.scrollVert.get(0).scrollLeft).to.eq(0)

      cy.get('#scroll-into-view-vertical h5').scrollIntoView().then(function () {
        expect(this.scrollVert.get(0).scrollTop).to.eq(300)
        expect(this.scrollVert.get(0).scrollLeft).to.eq(0)
      })
    })

    it('scrolls both axes of container to element', function () {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

      cy.get('#scroll-into-view-both h5').scrollIntoView().then(function () {
        expect(this.scrollBoth.get(0).scrollTop).to.eq(300)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(300)
      })
    })

    it('calls jQuery scroll to', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView().then(() => {
        expect(scrollTo).to.be.called
      })
    })

    it('sets duration to 0 by default', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView().then(() => {
        expect(scrollTo).to.be.calledWithMatch({}, { duration: 0 })
      })
    })

    it('sets axis to correct x or y', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView().then(() => {
        expect(scrollTo).to.be.calledWithMatch({}, { axis: 'xy' })
      })
    })

    it('scrolling resolves after a set duration', function () {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView({ duration: 500 }).then(function () {
        expect(scrollTo).to.be.calledWithMatch({}, { duration: 500 })
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(300)
        expect(this.scrollBoth.get(0).scrollTop).to.eq(300)
      })
    })

    it('accepts duration string option', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView({ duration: '500' }).then(() => {
        expect(scrollTo.args[0][1].duration).to.eq('500')
      })
    })

    it('accepts offset string option', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView({ offset: 500 }).then(() => {
        expect(scrollTo.args[0][1].offset).to.eq(500)
      })
    })

    it('accepts offset object option', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView({ offset: { left: 500, top: 200 } }).then(() => {
        expect(scrollTo.args[0][1].offset).to.deep.eq({ left: 500, top: 200 })
      })
    })

    it('has easing set to swing by default', () => {
      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView().then(() => {
        expect(scrollTo.args[0][1].easing).to.eq('swing')
      })
    })

    it('scrolling resolves after easing', function () {
      expect(this.scrollBoth.get(0).scrollTop).to.eq(0)
      expect(this.scrollBoth.get(0).scrollLeft).to.eq(0)

      const scrollTo = cy.spy($.fn, 'scrollTo')

      cy.get('#scroll-into-view-both h5').scrollIntoView({ easing: 'linear' }).then(function () {
        expect(scrollTo).to.be.calledWithMatch({}, { easing: 'linear' })
        expect(this.scrollBoth.get(0).scrollTop).to.eq(300)
        expect(this.scrollBoth.get(0).scrollLeft).to.eq(300)
      })
    })

    describe('shadow dom', () => {
      beforeEach(() => {
        cy.visit('/fixtures/shadow-dom.html')
      })

      // https://github.com/cypress-io/cypress/issues/7986
      it('does not hang', () => {
        cy.get('.shadow-1', { includeShadowDom: true }).scrollIntoView()
      })
    })

    describe('assertion verification', () => {
      beforeEach(function () {
        cy.on('log:added', (attrs, log) => {
          if (log.get('name') === 'assert') {
            this.lastLog = log
          }
        })

        return null
      })

      it('eventually passes the assertion', () => {
        cy.on('command:retry', _.after(2, () => {
          cy.$$('#scroll-into-view-win-vertical div').addClass('scrolled')
        }))

        cy
        .contains('scroll into view vertical')
        .scrollIntoView()
        .should('have.class', 'scrolled').then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('assert')
          expect(lastLog.get('state')).to.eq('passed')
          expect(lastLog.get('ended')).to.be.true
        })
      })
    })

    describe('errors', {
      defaultCommandTimeout: 50,
    }, () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      context('subject errors', () => {
        it('throws when not passed DOM element as subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` failed because it requires a DOM element.')
            expect(err.message).to.include('{foo: bar}')
            expect(err.message).to.include('> `cy.noop()`')

            done()
          })

          cy.noop({ foo: 'bar' }).scrollIntoView()
        })

        it('throws when passed window object as subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` failed because it requires a DOM element.')
            expect(err.message).to.include('<window>')
            expect(err.message).to.include('> `cy.window()`')

            done()
          })

          cy.window().scrollIntoView()
        })

        it('throws when passed document object as subject', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` failed because it requires a DOM element.')
            expect(err.message).to.include('<document>')
            expect(err.message).to.include('> `cy.document()`')

            done()
          })

          cy.document().scrollIntoView()
        })

        it('throws if scrollable container is multiple elements', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` can only be used to scroll to 1 element, you tried to scroll to 2 elements.')
            expect(err.docsUrl).to.include('https://on.cypress.io/scrollintoview')

            done()
          })

          cy.get('button').scrollIntoView()
        })
      })

      context('argument errors', () => {
        it('throws if arg passed as non-object', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` can only be called with an `options` object. Your argument was: `foo`')
            expect(err.docsUrl).to.eq('https://on.cypress.io/scrollintoview')

            done()
          })

          cy.get('#scroll-into-view-both h5').scrollIntoView('foo')
        })
      })

      context('option errors', () => {
        it('throws if duration is not a number or valid string', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` must be called with a valid `duration`. Duration may be either a number (ms) or a string representing a number (ms). Your duration was: `foo`')
            expect(err.docsUrl).to.include('https://on.cypress.io/scrollintoview')

            done()
          })

          cy.get('#scroll-into-view-both h5').scrollIntoView({ duration: 'foo' })
        })

        it('throws if unrecognized easing', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.scrollIntoView()` must be called with a valid `easing`. Your easing was: `flower`')
            expect(err.docsUrl).to.include('https://on.cypress.io/scrollintoview')

            done()
          })

          cy.get('#scroll-into-view-both h5').scrollIntoView({ easing: 'flower' })
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log

          return this.logs.push(log)
        })

        return null
      })

      it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#scroll-into-view-both h5').scrollIntoView({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('scrollIntoView')
          expect(hiddenLog).to.be.undefined
        })
      })

      it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
        cy.on('_log:added', (attrs, log) => {
          this.hiddenLog = log
        })

        cy.get('#scroll-into-view-both h5').scrollIntoView({ log: false })

        cy.then(function () {
          const { lastLog, hiddenLog } = this

          expect(lastLog.get('name'), 'log name').to.not.eq('scrollIntoView')

          expect(hiddenLog.get('name'), 'log name').to.eq('scrollIntoView')
          expect(hiddenLog.get('hidden'), 'log hidden').to.be.true
          expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      it('logs out scrollIntoView', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView().then(function () {
          const { lastLog } = this

          expect(lastLog.get('name')).to.eq('scrollIntoView')
        })
      })

      it('passes in $el', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView().then(function ($container) {
          const { lastLog } = this

          expect(lastLog.get('$el').get(0)).to.eq($container.get(0))
        })
      })

      it('logs duration options', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView({ duration: '1' }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{duration: 1}')
        })
      })

      it('logs easing options', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView({ easing: 'linear' }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{easing: linear}')
        })
      })

      it('logs offset options', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView({ offset: { left: 500, top: 200 } }).then(function () {
          const { lastLog } = this

          expect(lastLog.get('message')).to.eq('{offset: {left: 500, top: 200}}')
        })
      })

      it('snapshots immediately', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView().then(function () {
          const { lastLog } = this

          expect(lastLog.get('snapshots').length).to.eq(1)
          expect(lastLog.get('snapshots')[0]).to.be.an('object')
        })
      })

      it('#consoleProps', () => {
        cy.get('#scroll-into-view-both h5').scrollIntoView().then(function ($container) {
          const consoleProps = this.lastLog.invoke('consoleProps')

          expect(consoleProps.name).to.eq('scrollIntoView')
          expect(consoleProps.type).to.eq('command')
          expect(consoleProps.props['Applied To']).to.eq($container.get(0))
          expect(consoleProps.props['Scrolled Element']).to.exist
        })
      })
    })
  })
})
