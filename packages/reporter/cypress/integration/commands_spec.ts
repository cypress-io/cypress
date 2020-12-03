import { EventEmitter } from 'events'
import { RootRunnable } from './../../src/runnables/runnables-store'
import { addCommand } from '../support/utils'

describe('commands', () => {
  let runner: EventEmitter
  let runnables: RootRunnable
  const inProgressStartedAt = (new Date(2000, 0, 1)).toISOString()

  beforeEach(() => {
    cy.fixture('runnables_commands').then((_runnables) => {
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
      addCommand(runner, {
        id: 9,
        name: 'get',
        message: '#in-progress',
        state: 'pending',
        timeout: 4000,
        wallClockStartedAt: inProgressStartedAt,
      })
    })

    cy.contains('http://localhost:3000') // ensure test content has loaded
  })

  it('displays all the commands', () => {
    cy.get('.command').should('have.length', 9)
    cy.percySnapshot()
  })

  it('includes the type class', () => {
    cy.contains('#exists').closest('.command')
    .should('have.class', 'command-type-parent')

    cy.contains('#doesnt-exist').closest('.command')
    .should('have.class', 'command-type-child')
  })

  it('includes the name class', () => {
    cy.contains('#exists').closest('.command')
    .should('have.class', 'command-name-get')
  })

  it('includes the state class', () => {
    cy.contains('#exists').closest('.command')
    .should('have.class', 'command-state-passed')

    cy.contains('#doesnt-exist').closest('.command')
    .should('have.class', 'command-state-failed')

    cy.contains('#in-progress').closest('.command')
    .should('have.class', 'command-state-pending')
  })

  it('displays the number', () => {
    cy.contains('http://localhost:3000').closest('.command-message').siblings('.command-number')
    .should('have.text', '1')

    cy.contains('#exists').closest('.command-message').siblings('.command-number')
    .should('have.text', '2')

    cy.contains('#doesnt-exist').closest('.command-message').siblings('.command-number')
    .should('have.text', '3')

    cy.contains('.some-els').closest('.command-message').siblings('.command-number')
    .should('have.text', '4')
  })

  it('events have is-event class, no number, and type in parentheses', () => {
    cy.contains('GET ---').closest('.command')
    .should('have.class', 'command-is-event')

    cy.contains('GET ---').closest('.command-message').siblings('.command-number')
    .should('have.text', '')

    cy.contains('GET ---').closest('.command-message').siblings('.command-method')
    .should('have.text', '(xhr stub)')
  })

  it('includes the scaled class when the message is over 100 chars', () => {
    cy.contains('Lorem ipsum').closest('.command')
    .should('have.class', 'command-scaled')
  })

  it('does not render with the scaled class when the message is less than 100 chars', () => {
    cy.contains('#exists').closest('.command')
    .should('not.have.class', 'command-scaled')
  })

  it('renders markdown in message', () => {
    cy.contains('Lorem ipsum').closest('.command').find('.command-message').within(() => {
      cy.get('strong').should('have.text', 'dolor')
      cy.get('em').should('have.text', 'sit')
    })
  })

  it('shows indicator when specified', () => {
    cy.contains('GET ---').closest('.command').find('.command-message .fa-circle')
    .should('be.visible')
  })

  it('includes the renderProps indicator as a class name when specified', () => {
    cy.contains('Lorem ipsum').closest('.command').find('.command-message .fa-circle')
    .should('have.class', 'bad')
  })

  describe('progress bar', () => {
    const getProgress = () => {
      return cy.contains('#in-progress')
      .closest('.command')
      .find('.command-progress span')
    }

    it('calculates correct scale factor', () => {
      // take the wallClockStartedAt of this command and add 2500 milliseconds to it
      // in order to simulate the command having run for 2.5 seconds of the total 4000 timeout
      const date = new Date(inProgressStartedAt).setMilliseconds(2500)

      cy.clock(date, ['Date'])
      // close and open tests so it freshly mounts
      cy.contains('test 1').click().click()
      getProgress().should(($span) => {
        expect($span.attr('style')).to.contain('animation-duration: 1500ms')
        expect($span.attr('style')).to.contain('transform: scaleX(0.375)')

        // ensures that actual scale factor hits 0 within default timeout
        // this matrix is equivalent to scaleX(0)
        expect($span).to.have.css('transform', 'matrix(0, 0, 0, 1, 0, 0)')
      })
    })

    it('recalculates correct scale factor after being closed', () => {
      // take the wallClockStartedAt of this command and add 1000 milliseconds to it
      // in order to simulate the command having run for 1 second of the total 4000 timeout
      const date = new Date(inProgressStartedAt).setMilliseconds(1000)

      cy.clock(date, ['Date'])
      // close and open tests so it freshly mounts
      cy.contains('test').click().click()
      getProgress().should(($span) => {
        expect($span.attr('style')).to.contain('animation-duration: 3000ms')
        expect($span.attr('style')).to.contain('transform: scaleX(0.75)')
      })

      // set the clock ahead as if time has passed
      cy.tick(2000)

      cy.contains('test 1').click().click()
      getProgress().should(($span) => {
        expect($span.attr('style')).to.contain('animation-duration: 1000ms')
        expect($span.attr('style')).to.contain('transform: scaleX(0.25)')
      })
    })
  })

  context('invisible indicator', () => {
    it('does not display invisible icon when visible', () => {
      cy.contains('#exists').closest('.command').find('.command-invisible')
      .should('not.be.visible')
    })

    it('displays invisible icon when not visible', () => {
      cy.contains('#doesnt-exist').closest('.command').find('.command-invisible')
      .should('be.visible')
    })

    it('displays a tooltip when hovering', () => {
      cy.contains('#doesnt-exist').closest('.command').find('.command-invisible').trigger('mouseover')
      cy.get('.cy-tooltip')
      .should('be.visible')
      .should('have.text', 'This element is not visible.')
    })

    it('displays different text when multiple elements', () => {
      cy.contains('.invisible').closest('.command').find('.command-invisible').trigger('mouseover')
      cy.get('.cy-tooltip')
      .should('be.visible')
      .should('have.text', 'One or more matched elements are not visible.')
    })
  })

  context('elements indicator', () => {
    it('shows number of elements when 0 or greater than 1', () => {
      cy.contains('#doesnt-exist').closest('.command').find('.num-elements')
      .should('be.visible').and('have.text', '0')

      cy.contains('.some-els').closest('.command').find('.num-elements')
      .should('be.visible').and('have.text', '4')
    })

    it('does not show number of elements when 0', () => {
      cy.contains('#exists').closest('.command').find('.num-elements')
      .should('not.be.visible')
    })

    it('renders a tooltip when hovering', () => {
      cy.contains('.some-els').closest('.command').find('.num-elements').trigger('mouseover')
      cy.get('.cy-tooltip').should('be.visible').should('have.text', '4 matched elements')
    })
  })

  context('duplicates', () => {
    it('collapses consecutive duplicate events into one', () => {
      cy.get('.command-name-xhr').should('have.length', 3)
    })

    it('displays number of duplicates', () => {
      cy.contains('GET --- /dup').closest('.command').find('.num-duplicates')
      .should('have.text', '4')
    })

    it('expands all events after clicking arrow', () => {
      cy.contains('GET --- /dup').closest('.command').find('.command-expander').click()
      cy.get('.command-name-xhr').should('have.length', 6)
      cy.contains('GET --- /dup').closest('.command').find('.duplicates')
      .should('be.visible')
      .find('.command').should('have.length', 3)
    })
  })

  context('clicking', () => {
    it('pins the command', () => {
      cy.contains('#exists').click()
      .closest('.command')
      .should('have.class', 'command-is-pinned')
    })

    it('shows a tooltip', () => {
      cy.contains('#exists').click()
      cy.get('.cy-tooltip').should('have.text', 'Printed output to your console')
    })

    it('tooltip disappears after 1500ms', () => {
      cy.clock()
      cy.contains('#exists').click()
      cy.tick(1500)
      cy.get('.cy-tooltip').should('not.exist')
    })

    it('emits runner:console:log', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.wrap(runner.emit).should('be.calledWith', 'runner:console:log', 2)
    })

    it('shows the snapshot', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.wrap(runner.emit).should('be.calledWith', 'runner:show:snapshot', 2)
    })

    it('unpins after clicking again, does not emit runner:console:log again', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.contains('#exists').click()
      // @ts-ignore
      cy.wrap(runner.emit.withArgs('runner:console:log')).should('be.calledOnce')
    })

    it('unpins after clicking another command, pins that one', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.contains('#doesnt-exist').click()
      cy.contains('#exists').closest('.command')
      .should('not.have.class', 'command-is-pinned')

      cy.contains('#doesnt-exist').closest('.command')
      .should('have.class', 'command-is-pinned')
    })
  })

  context('mousing over', () => {
    beforeEach(() => {
      cy.spy(runner, 'emit')
      cy.clock()
      cy.get('.command').first().trigger('mouseover')
    })

    it('shows snapshot after 50ms passes', () => {
      cy.wrap(runner.emit).should('not.be.calledWith', 'runner:show:snapshot')
      cy.tick(50)
      cy.wrap(runner.emit).should('be.calledWith', 'runner:show:snapshot', 1)
    })

    describe('then mousing out', () => {
      beforeEach(() => {
        cy.tick(50)
        cy.get('.command').first().trigger('mouseout')
      })

      it('hides the snapshot after 50ms pass without another mouse over', () => {
        cy.tick(50)
        cy.wrap(runner.emit).should('be.calledWith', 'runner:hide:snapshot', 1)
      })

      it('does not hide the snapshot if there is another mouseover before 50ms passes', () => {
        cy.wrap(runner.emit).should('not.be.calledWith', 'runner:hide:snapshot')
      })
    })
  })
})
