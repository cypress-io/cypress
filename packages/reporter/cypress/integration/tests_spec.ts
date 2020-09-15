import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('tests', function () {
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
        this.passingTestTitle = this.runnables.suites[0].tests[0].title
        this.failingTestTitle = this.runnables.suites[0].tests[1].title

        this.runner.emit('runnables:ready', this.runnables)
        this.runner.emit('reporter:start', {})
      })
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

      it('calculates correct scale factor', function () {
        const { wallClockStartedAt } = this.runnables.suites[0].suites[0].tests[1].commands[0]

        // take the wallClockStartedAt of this command and add 2500 milliseconds to it
        // in order to simulate the command having run for 2.5 seconds of the total 4000 timeout
        const date = new Date(wallClockStartedAt).setMilliseconds(2500)

        cy.clock(date, ['Date'])
        cy.get('.runnable-active').click()
        cy.get('.command-progress > span').should(($span) => {
          expect($span.attr('style')).to.contain('animation-duration: 1500ms')
          expect($span.attr('style')).to.contain('transform: scaleX(0.375)')

          // ensures that actual scale factor hits 0 within default timeout
          // this matrix is equivalent to scaleX(0)
          expect($span).to.have.css('transform', 'matrix(0, 0, 0, 1, 0, 0)')
        })
      })

      it('recalculates correct scale factor after being closed', function () {
        const { wallClockStartedAt } = this.runnables.suites[0].suites[0].tests[1].commands[0]

        // take the wallClockStartedAt of this command and add 1000 milliseconds to it
        // in order to simulate the command having run for 1 second of the total 4000 timeout
        const date = new Date(wallClockStartedAt).setMilliseconds(1000)

        cy.clock(date, ['Date'])
        cy.get('.runnable-active').click()
        cy.get('.command-progress > span').should(($span) => {
          expect($span.attr('style')).to.contain('animation-duration: 3000ms')
          expect($span.attr('style')).to.contain('transform: scaleX(0.75)')
        })

        // set the clock ahead as if time has passed
        cy.tick(2000)

        cy.get('.runnable-active > .collapsible > .runnable-wrapper').click().click()
        cy.get('.command-progress > span').should(($span) => {
          expect($span.attr('style')).to.contain('animation-duration: 1000ms')
          expect($span.attr('style')).to.contain('transform: scaleX(0.25)')
        })
      })
    })

    describe('filtering', function () {
      beforeEach(() => {
        cy.get('.toggle-options').click()
      })

      it('displays when the "Passed" filter is selected and it is passed', () => {
        cy.get('.filter-passed').click()
        cy.contains('test 1').should('be.visible')
        cy.contains('test 3').should('be.visible')
        cy.contains('test 4').should('be.visible')
      })

      it('does not display when the "Passed" filter is selected and it is not passed', () => {
        cy.get('.filter-passed').click()
        cy.contains('test 2').should('not.exist')
        cy.contains('test 5').should('not.exist')
        cy.contains('test (nested) 1').should('not.exist')
        cy.contains('test (nested) 2').should('not.exist')
      })

      it('displays when the "Failed" filter is selected and it is failed', () => {
        cy.get('.filter-failed').click()
        cy.contains('test 2').should('be.visible')
      })

      it('does not display when the "Failed" filter is selected and it is not failed', () => {
        cy.get('.filter-failed').click()
        cy.contains('test 1').should('not.exist')
        cy.contains('test 3').should('not.exist')
        cy.contains('test 4').should('not.exist')
        cy.contains('test 5').should('not.exist')
        cy.contains('test (nested) 1').should('not.exist')
        cy.contains('test (nested) 2').should('not.exist')
      })

      it('displays when the "Pending" filter is selected and it is pending', () => {
        cy.get('.filter-pending').click()
        cy.contains('test (nested) 1').should('be.visible')
      })

      it('does not display when the "Pending" filter is selected and it is not pending', () => {
        cy.get('.filter-pending').click()
        cy.contains('test 1').should('not.exist')
        cy.contains('test 2').should('not.exist')
        cy.contains('test 3').should('not.exist')
        cy.contains('test 4').should('not.exist')
        cy.contains('test 5').should('not.exist')
        cy.contains('test (nested) 2').should('not.exist')
      })

      it('does not display when any filter and no children', () => {
        cy.get('.filter-passed').click()
        cy.get('.clear-filter').click()

        cy.contains('test 1').scrollIntoView().should('be.visible')
        cy.contains('test 2').scrollIntoView().should('be.visible')
        cy.contains('test 3').scrollIntoView().should('be.visible')
        cy.contains('test 4').scrollIntoView().should('be.visible')
        cy.contains('test 5').scrollIntoView().should('be.visible')
        cy.contains('test (nested) 1').scrollIntoView().should('be.visible')
        cy.contains('test (nested) 2').scrollIntoView().should('be.visible')
      })

      it('always displays running test', function () {
        cy.wrap({}).then(() => {
          this.runner.emit('test:before:run:async', { id: 'r7' })
        })

        cy.get('.filter-passed').click()
        cy.contains('test (nested) 2').should('be.visible')
        cy.get('.filter-failed').click()
        cy.contains('test (nested) 2').should('be.visible')
        cy.get('.filter-pending').click()
        cy.contains('test (nested) 2').should('be.visible')
      })

      it('displays empty message when none match', function () {
        this.runnables.suites = []
        this.runnables.tests = [{
          'id': 'r1',
          'title': 'test 1',
        }, {
          'id': 'r2',
          'title': 'test 2',
        }, {
          'id': 'r3',
          'title': 'test 3',
        }]

        this.runner.emit('runnables:ready', this.runnables)

        cy.get('.filter-passed').click()
        cy.get('.filter-empty-message')
        .should('be.visible')
        .should('have.length', 1)
        .should('have.text', 'No tests match the filter "Passed"')
      })
    })
  })
})
