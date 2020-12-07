import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'

const { _ } = Cypress

describe('header', () => {
  let runner: EventEmitter
  let runnables: RootRunnable

  beforeEach(() => {
    cy.fixture('runnables').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    cy.visit('/').then((win) => {
      win.render({
        runner,
        spec: {
          name: 'foo',
          absolute: '/foo/bar',
          relative: 'foo/bar',
        },
      })
    })

    cy.get('.reporter').then(() => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  describe('tests button', () => {
    it('displays tooltip on mouseover', () => {
      cy.get('.focus-tests').trigger('mouseover')
      cy.get('.cy-tooltip').should('have.text', 'View All Tests F')
    })

    it('focuses tests on click', () => {
      cy.spy(runner, 'emit')
      // { force: true } is necessary for click to work, apparently because
      // of the tooltip popping up and getting in the way
      cy.get('.focus-tests button').click({ force: true })
      cy.wrap(runner.emit).should('be.calledWith', 'focus:tests')
    })

    it('shows \'Tests\' when >= 400px wide', () => {
      cy.get('.focus-tests span').should('be.visible')
    })

    it('hides \'Tests\' < 400px wide', () => {
      cy.viewport(399, 450)
      cy.get('.focus-tests span').should('not.be.visible')
    })
  })

  describe('stats', () => {
    let addStat: Function

    beforeEach(() => {
      addStat = (state: string, times: number) => {
        _.times(times, () => {
          runner.emit('test:after:run', { state, final: true })
        })
      }
    })

    it('displays numbers for passed, failed, and pending tests', () => {
      addStat('passed', 2)
      addStat('failed', 3)
      addStat('pending', 1)

      cy.get('.passed .num').should('have.text', '2')
      cy.get('.failed .num').should('have.text', '3')
      cy.get('.pending .num').should('have.text', '1')

      // ensure the page is loaded before taking snapshot
      cy.contains('test 4').should('be.visible')
      cy.percySnapshot()
    })

    it('displays "--" if zero of the given state', () => {
      cy.get('.passed .num').should('have.text', '--')
      cy.get('.failed .num').should('have.text', '--')
      cy.get('.pending .num').should('have.text', '--')
    })

    it('displays the time taken in seconds', () => {
      const start = new Date(2000, 0, 1)
      const now = new Date(2000, 0, 1, 0, 0, 12, 340)

      cy.clock(now).then(() => {
        runner.emit('reporter:start', { startTime: start.toISOString() })
      })

      cy.get('.duration .num').should('have.text', '12.34')
    })

    it('displays "--" if no time taken', () => {
      cy.get('.duration .num').should('have.text', '--')
    })
  })

  describe('controls', () => {
    describe('when running, not paused, and/or without next command', () => {
      beforeEach(() => {
        runner.emit('run:start')
      })

      describe('auto-scrolling button', () => {
        it('is displayed', () => {
          cy.get('.toggle-auto-scrolling').should('be.visible')
        })

        it('has auto-scrolling-enabled class when auto-scrolling is enabled', () => {
          cy.get('.toggle-auto-scrolling').should('have.class', 'auto-scrolling-enabled')
        })

        it('does not have auto-scrolling-enabled class when auto-scrolling is disabled', () => {
          runner.emit('reporter:start', { autoScrollingEnabled: false })

          cy.get('.toggle-auto-scrolling').should('not.have.class', 'auto-scrolling-enabled')
        })

        it('has tooltip with right title when auto-scrolling is enabled', () => {
          cy.get('.toggle-auto-scrolling').trigger('mouseover')
          cy.get('.cy-tooltip').should('have.text', 'Disable Auto-scrolling')
        })

        it('has tooltip with right title when auto-scrolling is disabled', () => {
          runner.emit('reporter:start', { autoScrollingEnabled: false })

          cy.get('.toggle-auto-scrolling').trigger('mouseover')
          cy.get('.cy-tooltip').should('have.text', 'Enable Auto-scrolling')
        })

        it('emits save:state event when clicked', () => {
          cy.spy(runner, 'emit')
          cy.get('.toggle-auto-scrolling').click()
          cy.wrap(runner.emit).should('be.calledWith', 'save:state')
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
        it('does not display paused label', () => {
          cy.get('.paused-label').should('not.exist')
        })

        it('does not display play button', () => {
          cy.get('.play').should('not.exist')
        })

        it('does not display restart button', () => {
          cy.get('.restart').should('not.exist')
        })

        it('does not display next button', () => {
          cy.get('.next').should('not.exist')
        })
      })
    })

    describe('when paused with next command', () => {
      beforeEach(() => {
        runner.emit('paused', 'find')
      })

      it('displays paused label', () => {
        cy.get('.paused-label').should('be.visible')
      })

      it('displays play button', () => {
        cy.get('.play').should('be.visible')
      })

      it('displays tooltip for play button', () => {
        cy.get('.play').trigger('mouseover')
        cy.get('.cy-tooltip').should('have.text', 'Resume')
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
        cy.get('.cy-tooltip').should('have.text', `Next: 'find'`)
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
})
