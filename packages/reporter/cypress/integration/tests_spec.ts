import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('controls', function () {
  context('all specs', function () {
    beforeEach(function () {
      cy.fixture('runnables').as('runnables')

      this.runner = new EventEmitter()

      cy.visit('/dist').then((win) => {
        win.render({
          runner: this.runner,
          spec: {
            relative: '__all',
            name: '',
            absolute: '',
          },
        })
      })

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnables)

        this.runner.emit('reporter:start', {})
      })
    })

    it('shows header', () => {
      cy.contains('.runnable-header', 'All Specs')
    })
  })

  context('filtered specs', function () {
    beforeEach(function () {
      cy.fixture('runnables').as('runnables')

      this.runner = new EventEmitter()

      cy.visit('/dist').then((win) => {
        win.render({
          runner: this.runner,
          spec: {
            relative: '__all',
            name: '',
            absolute: '',
            specFilter: 'cof',
          },
        })
      })

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnables)

        this.runner.emit('reporter:start', {})
      })
    })

    it('shows header', () => {
      cy.contains('.runnable-header', 'Specs matching "cof"')
    })
  })

  context('single spec', function () {
    beforeEach(function () {
      cy.fixture('runnables').as('runnables')

      this.runner = new EventEmitter()

      cy.visit('/dist').then((win) => {
        win.render({
          runner: this.runner,
          spec: {
            name: 'foo.js',
            relative: 'relative/path/to/foo.js',
            absolute: '/absolute/path/to/foo.js',
          },
        })
      })

      cy.get('.reporter').then(() => {
        this.runner.emit('runnables:ready', this.runnables)

        this.runner.emit('reporter:start', {})
      })
    })

    describe('tests', function () {
      beforeEach(function () {
        this.passingTestTitle = this.runnables.suites[0].tests[0].title
        this.failingTestTitle = this.runnables.suites[0].tests[1].title
      })

      describe('expand and collapse', function () {
        it('is collapsed by default', function () {
          cy.contains(this.passingTestTitle)
          .parents('.collapsible').first()
          .should('not.have.class', 'is-open')
          .find('.collapsible-content')
          .should('not.be.visible')
        })

        describe('expand/collapse test manually', function () {
          beforeEach(function () {
            cy.contains(this.passingTestTitle)
            .parents('.collapsible').first().as('testWrapper')
            .should('not.have.class', 'is-open')
            .find('.collapsible-content')
            .should('not.be.visible')
          })

          it('expands/collapses on click', function () {
            cy.contains(this.passingTestTitle)
            .click()

            cy.get('@testWrapper')
            .should('have.class', 'is-open')
            .find('.collapsible-content').should('be.visible')

            cy.contains(this.passingTestTitle)
            .click()

            cy.get('@testWrapper')
            .should('not.have.class', 'is-open')
            .find('.collapsible-content').should('not.be.visible')
          })

          it('expands/collapses on enter', function () {
            cy.contains(this.passingTestTitle)
            .parents('.collapsible-header').first()
            .focus().type('{enter}')

            cy.get('@testWrapper')
            .should('have.class', 'is-open')
            .find('.collapsible-content').should('be.visible')

            cy.contains(this.passingTestTitle)
            .parents('.collapsible-header').first()
            .focus().type('{enter}')

            cy.get('@testWrapper')
            .should('not.have.class', 'is-open')
            .find('.collapsible-content').should('not.be.visible')
          })

          it('expands/collapses on space', function () {
            cy.contains(this.passingTestTitle)
            .parents('.collapsible-header').first()
            .focus().type(' ')

            cy.get('@testWrapper')
            .should('have.class', 'is-open')
            .find('.collapsible-content').should('be.visible')

            cy.contains(this.passingTestTitle)
            .parents('.collapsible-header').first()
            .focus().type(' ')

            cy.get('@testWrapper')
            .should('not.have.class', 'is-open')
            .find('.collapsible-content').should('not.be.visible')
          })
        })
      })

      describe('failed tests', function () {
        it('expands automatically', function () {
          cy.contains(this.failingTestTitle)
          .parents('.collapsible').first()
          .should('have.class', 'is-open')
          .find('.collapsible-content')
          .should('be.visible')
        })
      })

      describe('header', function () {
        it('displays', function () {
          cy.get('.runnable-header').find('a').should('have.text', 'relative/path/to/foo.js')
        })

        it('displays tooltip on hover', () => {
          cy.get('.runnable-header a').first().trigger('mouseover')
          cy.get('.cy-tooltip').first().should('have.text', 'Open in IDE')
        })

        itHandlesFileOpening('.runnable-header a', {
          file: '/absolute/path/to/foo.js',
          line: 0,
          column: 0,
        })
      })

      describe('progress bar', function () {
        it('displays', function () {
          cy.get('.runnable-active').click()
          cy.get('.command-progress').should('be.visible')
        })

        it('calculates correct width', function () {
          const { wallClockStartedAt } = this.runnables.suites[0].suites[0].tests[1].commands[0]

          // take the wallClockStartedAt of this command and add 2500 milliseconds to it
          // in order to simulate the command having run for 2.5 seconds of the total 4000 timeout
          const date = new Date(wallClockStartedAt).setMilliseconds(2500)

          cy.clock(date, ['Date'])
          cy.get('.runnable-active').click()
          cy.get('.command-progress > span').should(($span) => {
            expect($span.attr('style')).to.contain('animation-duration: 1500ms')
            expect($span.attr('style')).to.contain('width: 37.5%')

            // ensures that actual width hits 0 within default timeout
            expect($span).to.have.css('width', '0px')
          })
        })

        it('recalculates correct width after being closed', function () {
          const { wallClockStartedAt } = this.runnables.suites[0].suites[0].tests[1].commands[0]

          // take the wallClockStartedAt of this command and add 1000 milliseconds to it
          // in order to simulate the command having run for 1 second of the total 4000 timeout
          const date = new Date(wallClockStartedAt).setMilliseconds(1000)

          cy.clock(date, ['Date'])
          cy.get('.runnable-active').click()
          cy.get('.command-progress > span').should(($span) => {
            expect($span.attr('style')).to.contain('animation-duration: 3000ms')
            expect($span.attr('style')).to.contain('width: 75%')
          })

          // set the clock ahead as if time has passed
          cy.tick(2000)

          cy.get('.runnable-active > .collapsible > .runnable-wrapper').click().click()
          cy.get('.command-progress > span').should(($span) => {
            expect($span.attr('style')).to.contain('animation-duration: 1000ms')
            expect($span.attr('style')).to.contain('width: 25%')
          })
        })
      })
    })
  })
})
