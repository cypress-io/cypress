import { TestFilter } from '@packages/types'
import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'

const { _ } = Cypress

describe('header', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  function setupReporter (opts?: { testFilter: TestFilter, totalUnfilteredTests: number, skipRunnableCreation?: boolean}) {
    if (opts?.skipRunnableCreation) {
      runnables = {}
    } else {
      cy.fixture('runnables').then((_runnables) => {
        runnables = _runnables
      })
    }

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        runnerStore: {
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        },
      })
    })

    cy.get('.reporter.mounted').then(() => {
      runner.emit('runnables:ready', { ...runnables, testFilter: opts?.testFilter, totalUnfilteredTests: opts?.totalUnfilteredTests })
      runner.emit('reporter:start', {})
    })
  }

  describe('tests button', () => {
    beforeEach(() => {
      setupReporter()
    })

    it('displays tooltip on mouseover', () => {
      cy.get('.toggle-specs-wrapper').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'Expand Specs List F')
    })

    it('emits save state on click', () => {
      cy.spy(runner, 'emit')
      // { force: true } is necessary for click to work, apparently because
      // of the tooltip popping up and getting in the way
      cy.get('.toggle-specs-wrapper button').click({ force: true })
      cy.wrap(runner.emit).should('be.calledWith', 'save:state')
    })

    it('shows \'Tests\' when >= 398px wide', () => {
      cy.get('[data-cy=toggle-specs-button]').should('be.visible')
    })
  })

  describe('stats', () => {
    beforeEach(() => {
      setupReporter()
    })

    it('displays numbers for passed, failed, and pending tests', () => {
      const addStat = (state: string, times: number) => {
        _.times(times, () => {
          runner.emit('test:after:run', { state, final: true })
        })
      }

      addStat('passed', 4)
      addStat('failed', 2)
      addStat('pending', 2)

      cy.get('.passed .num').should('have.text', '4')
      cy.get('.failed .num').should('have.text', '2')
      cy.get('.pending .num').should('have.text', '2')

      // ensure the page is loaded before taking snapshot
      cy.contains('suite 1').should('be.visible')
      cy.percySnapshot()
    })

    it('displays "--" if zero of the given state', () => {
      cy.get('.passed .num').should('have.text', '--')
      cy.get('.failed .num').should('have.text', '--')
      cy.get('.pending .num').should('have.text', '--')
    })
  })

  describe('controls', () => {
    beforeEach(() => {
      setupReporter()
    })

    describe('when running, not paused, and/or without next command', () => {
      beforeEach(() => {
        runner.emit('run:start')
      })

      describe('more options menu', () => {
        it('can be opened', () => {
          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('not.exist')
          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')
        })

        it('has tooltip', () => {
          cy.get('[data-cy="runnable-options-button"]').trigger('mouseover')
          cy.get('.cy-tooltip').should('have.text', 'Options')
        })

        it('shows when auto-scrolling is enabled and can disable it', () => {
          const switchSelector = '[data-cy=auto-scroll-switch]'

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
          cy.get(switchSelector).click()
          cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
        })

        it('can be toggled with shortcut', () => {
          const switchSelector = '[data-cy=auto-scroll-switch]'

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
          cy.get('body').type('a').then(() => {
            cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
          })
        })

        it('the auto-scroll toggle emits save:state event when clicked', () => {
          cy.spy(runner, 'emit')

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get('[data-cy=auto-scroll-switch]').click()
          cy.wrap(runner.emit).should('be.calledWith', 'save:state')
          cy.percySnapshot()
        })

        it('shows when show fetch requests is enabled and can disable it', () => {
          const switchSelector = '[data-cy=show-http-requests-switch]'

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'true')
          cy.get(switchSelector).click()
          cy.get(switchSelector).invoke('attr', 'aria-checked').should('eq', 'false')
        })

        it('the show fetch requests toggle emits save:state event when clicked', () => {
          cy.spy(runner, 'emit')

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get('[data-cy=show-http-requests-switch]').click()
          cy.wrap(runner.emit).should('be.calledWith', 'save:state')
          cy.percySnapshot()
        })

        it('opens the open in IDE button', () => {
          cy.spy(runner, 'emit')

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get('[data-cy="runnable-popover-open-ide"]').click()
          cy.wrap(runner.emit).should('be.calledWith', 'open:file:unified')
        })

        it('opens the new test button', () => {
          cy.spy(runner, 'emit')

          cy.get('[data-cy="runnable-options-button"]').click()
          cy.get('[data-cy="more-options-runnable-popover"]').should('be.visible')

          cy.get('[data-cy="runnable-popover-new-test"]').click()
          cy.wrap(runner.emit).should('be.calledWith', 'studio:init:suite')
        })
      })

      describe('stop button', () => {
        it('displays stop button', () => {
          cy.get('.stop').should('be.visible')
        })

        it('displays tooltip', () => {
          cy.get('.stop').trigger('mouseover')
          cy.get('.cy-tooltip').should('have.text', 'Stop Running S')
        })

        it('emits runner:stop when clicked', () => {
          cy.spy(runner, 'emit')
          cy.get('.stop').click()
          cy.wrap(runner.emit).should('be.calledWith', 'runner:stop')
        })
      })

      describe('pause controls', () => {
        it('does not display play button', () => {
          cy.get('.play').should('not.exist')
        })

        it('does not display restart button', () => {
          cy.get('.restart').should('not.exist')
        })

        it('does not display the next button', () => {
          cy.get('.next').should('not.exist')
        })
      })
    })

    describe('when running after resume', () => {
      beforeEach(() => {
        runner.emit('run:start')
        runner.emit('paused')
        cy.get('.play').click()
      })

      it('displays next button as disabled when running after resume', () => {
        cy.get('.next').should('be.visible').and('be.disabled')
      })

      it('shows "Step (not available)" tooltip when running after resume', () => {
        cy.get('.next').trigger('mouseover', { force: true })
        cy.get('.cy-tooltip').should('have.text', 'Step (not available)')
      })

      it('does not emit runner:next when disabled button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.next').click({ force: true })
        cy.wrap(runner.emit).should('not.be.calledWith', 'runner:next')
      })

      it('displays stop button when running after resume', () => {
        cy.get('.stop').should('be.visible')
      })
    })

    describe('when paused without next command', () => {
      beforeEach(() => {
        runner.emit('paused')
      })

      it('displays play button', () => {
        cy.get('.play').should('be.visible')
      })

      it('displays tooltip for play button', () => {
        cy.get('.play').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Resume C')
      })

      it('emits runner:resume when play button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.play').click()
        cy.wrap(runner.emit).should('be.calledWith', 'runner:resume')
      })

      it('displays next button', () => {
        cy.get('.next').should('be.visible').and('be.disabled')
      })

      it('shows "Step (not available)" tooltip when next button is disabled', () => {
        cy.get('.next').trigger('mouseover', { force: true })
        cy.get('.cy-tooltip').should('have.text', 'Step (not available)')
      })

      it('does not emit runner:next when disabled next button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.next').click({ force: true })
        cy.wrap(runner.emit).should('not.be.calledWith', 'runner:next')
      })

      it('does not display stop button', () => {
        cy.get('.stop').should('not.exist')
      })
    })

    describe('when paused with next command', () => {
      beforeEach(() => {
        runner.emit('paused', 'find')
      })

      it('displays play button', () => {
        cy.get('.play').should('be.visible')
      })

      it('displays tooltip for play button', () => {
        cy.get('.play').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Resume C')
      })

      it('emits runner:resume when play button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.play').click()
        cy.wrap(runner.emit).should('be.calledWith', 'runner:resume')
      })

      it('displays next button', () => {
        cy.get('.next').should('be.visible')
      })

      it('displays tooltip for next button', () => {
        cy.get('.next').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Next N : find')
      })

      it('emits runner:next when next button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.next').click()
        cy.wrap(runner.emit).should('be.calledWith', 'runner:next')
      })

      it('does not display stop button', () => {
        cy.get('.stop').should('not.exist')
      })
    })

    describe('when not running', () => {
      it('displays restart button', () => {
        cy.get('.restart').should('be.visible')
      })

      it('displays tooltip for restart button', () => {
        cy.get('.restart').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Run All Tests R')
      })

      it('emits runner:restart when restart button is clicked', () => {
        cy.spy(runner, 'emit')
        cy.get('.restart').click()
        cy.wrap(runner.emit).should('be.calledWith', 'runner:restart')
      })

      it('does not display stop button', () => {
        cy.get('.stop').should('not.exist')
      })
    })
  })

  describe('debug test filter', () => {
    it('displays debug filter when Cypress.testFilter is defined', () => {
      setupReporter({ testFilter: ['suite 1 test 2'], totalUnfilteredTests: 10 })
      cy.spy(runner, 'emit').as('debugDismiss')
      cy.get('.debug-dismiss').contains(`8 / 10 tests`).click()
      cy.get('@debugDismiss').should('have.been.called')
      cy.percySnapshot()
    })

    it('does not display filter when there are no tests', () => {
      setupReporter({ testFilter: ['suite 1 test 2'], totalUnfilteredTests: 10, skipRunnableCreation: true })
      cy.get('.debug-dismiss').should('not.exist')
    })
  })
})
