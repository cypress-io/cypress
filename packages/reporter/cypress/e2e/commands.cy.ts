import { EventEmitter } from 'events'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { addCommand } from '../support/utils'

describe('commands', { viewportHeight: 1000 }, () => {
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
        runnerStore: {
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
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
    addCommand(runner, {
      id: 102,
      name: 'get',
      message: '#element',
      state: 'passed',
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 124,
      name: 'within',
      state: 'passed',
      type: 'child',
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 125,
      name: 'get',
      message: '#my_element',
      state: 'passed',
      timeout: 4000,
      group: 124,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 129,
      name: 'within',
      state: 'passed',
      type: 'child',
      group: 124,
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 130,
      name: 'get',
      message: '#my_element that _has_ a really long message to show **wrapping** works as expected',
      state: 'passed',
      timeout: 4000,
      groupLevel: 1,
      group: 129,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1229,
      name: 'within',
      state: 'passed',
      type: 'child',
      group: 130,
      groupLevel: 1,
      timeout: 4000,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1311,
      name: 'get',
      message: '#my_element_nested',
      state: 'passed',
      timeout: 4000,
      groupLevel: 2,
      group: 1229,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1291,
      name: 'assert',
      type: 'child',
      message: 'has class named .omg',
      state: 'passed',
      timeout: 4000,
      group: 1229,
      groupLevel: 2,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1293,
      name: 'log',
      message: 'do something else',
      state: 'passed',
      timeout: 4000,
      group: 130,
      groupLevel: 1,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 135,
      name: 'and',
      type: 'child',
      message: 'has class named .lets-roll',
      state: 'passed',
      timeout: 4000,
      group: 124,
      wallClockStartedAt: inProgressStartedAt,
    })

    const indicators = ['successful', 'pending', 'aborted', 'bad']

    indicators.forEach((indicator, index) => {
      addCommand(runner, {
        id: 1600 + index,
        name: 'xhr',
        event: true,
        state: 'passed',
        timeout: 4000,
        renderProps: {
          indicator,
          message: `${indicator} indicator`,
        },
        wallClockStartedAt: inProgressStartedAt,
      })
    })

    const assertStates = ['passed', 'pending', 'failed']

    assertStates.forEach((state, index) => {
      addCommand(runner, {
        id: 1700 + index,
        name: 'assert',
        type: 'child',
        message: 'expected **element** to have length of **16** but got **12** instead',
        state,
        timeout: 4000,
        wallClockStartedAt: inProgressStartedAt,
      })
    })

    cy.get('.command').should('have.length', 27)

    cy.percySnapshot()
  })

  it('displays assertions formatted', () => {
    addCommand(runner, {
      id: 1291,
      name: 'assert',
      type: 'child',
      message: 'expected **value** to equal **value**',
      state: 'passed',
      timeout: 4000,
      group: 1229,
      groupLevel: 2,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1292,
      name: 'assert',
      type: 'child',
      message: 'expected **value** to match **value**',
      state: 'passed',
      timeout: 4000,
      group: 1229,
      groupLevel: 2,
      wallClockStartedAt: inProgressStartedAt,
    })

    addCommand(runner, {
      id: 1293,
      name: 'assert',
      type: 'child',
      message: 'expected **_value_** to contain **_value_**',
      state: 'passed',
      timeout: 4000,
      group: 1229,
      groupLevel: 2,
      wallClockStartedAt: inProgressStartedAt,
    })

    cy.contains('.command-message-text', 'to equal')
    .find('strong').should('have.length', 2)
    .and('contain', 'value')
    .and('not.contain', '*')

    cy.contains('.command-message-text', 'to match')
    .find('strong').should('have.length', 2)
    .and('contain', 'value')
    .and('not.contain', '*')

    cy.percySnapshot()
  })

  it('includes the type class', () => {
    cy.contains('#exists').closest('.command-wrapper')
    .should('have.class', 'command-type-parent')

    cy.contains('#doesnt-exist').closest('.command-wrapper')
    .should('have.class', 'command-type-child')
  })

  it('includes the name class', () => {
    cy.contains('#exists').closest('.command')
    .should('have.class', 'command-name-get')
  })

  it('includes the state class', () => {
    cy.contains('#exists').closest('.command-wrapper')
    .should('have.class', 'command-state-passed')

    cy.contains('#doesnt-exist').closest('.command-wrapper')
    .should('have.class', 'command-state-failed')

    cy.contains('#in-progress').closest('.command-wrapper')
    .should('have.class', 'command-state-pending')
  })

  it('displays the number for parent and child', () => {
    cy.contains('http://localhost:3000')
    .closest('.command-pin-target')
    .siblings('.command-number-column')
    .should('have.text', '1')

    cy.contains('#exists').closest('.command-pin-target').siblings('.command-number-column')
    .should('have.text', '2')

    cy.contains('#doesnt-exist').closest('.command-pin-target').siblings('.command-number-column')
    .should('have.text', '3')

    cy.contains('.some-els').closest('.command-pin-target').siblings('.command-number-column')
    .should('have.text', '4')
  })

  it('events have is-event class, no number, and type in parentheses', () => {
    cy.contains('GET ---').closest('.command-wrapper')
    .should('have.class', 'command-is-event')

    cy.contains('GET ---').closest('.command-pin-target').siblings('.command-number-column')
    .should('have.text', '')

    cy.contains('GET ---').closest('.command-message').siblings('.command-method')
    .should('have.text', '(xhr stub)')
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

  it('shows message indicator when specified', () => {
    const indicators = ['successful', 'pending', 'aborted', 'bad']

    indicators.forEach((indicator) => {
      addCommand(runner, {
        name: 'xhr',
        event: true,
        renderProps: {
          indicator,
          message: `${indicator} indicator`,
        },
      })
    })

    indicators.forEach((indicator) => {
      cy.contains(`${indicator} indicator`).closest('.command').find('.command-message .fa-circle')
      .should('have.class', 'far')
      .should('have.class', `command-message-indicator-${indicator}`)
    })

    cy.percySnapshot()
  })

  it('shows message indicator when specified and request went to origin', () => {
    const indicators = ['successful', 'pending', 'aborted', 'bad']

    indicators.forEach((indicator) => {
      addCommand(runner, {
        name: 'xhr',
        event: true,
        renderProps: {
          indicator,
          wentToOrigin: true,
          message: `${indicator} indicator`,
        },
      })
    })

    indicators.forEach((indicator) => {
      cy.contains(`${indicator} indicator`).closest('.command').find('.command-message .fa-circle')
      .should('have.class', 'fas')
      .should('have.class', `command-message-indicator-${indicator}`)
    })

    cy.percySnapshot()
  })

  it('assert commands for each state', () => {
    const assertStates = ['passed', 'pending', 'failed']

    assertStates.forEach((state) => {
      addCommand(runner, {
        name: 'assert',
        type: 'child',
        message: `expected **element** to have **state of ${state}**`,
        state,
      })
    })

    cy.get('.command').should('have.length', 13)

    cy.percySnapshot()
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
    it('does not render invisible icon when visible', () => {
      cy.contains('#exists').closest('.command').find('.command-invisible')
      .should('not.exist')
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

    it('does not render number of elements when 1', () => {
      cy.contains('#exist').closest('.command').find('.num-elements')
      .should('not.exist')
    })

    it('renders a tooltip when hovering', () => {
      cy.contains('.some-els').closest('.command').find('.num-elements').trigger('mouseover')
      cy.get('.cy-tooltip').should('be.visible').should('have.text', '4 matched elements')
    })
  })

  context('event duplicates', () => {
    it('collapses consecutive duplicate events into a single log', () => {
      cy.get('.command-name-xhr').should('have.length', 3)
    })

    it('displays number of duplicates', () => {
      cy.contains('GET --- /dup')
      .closest('.command')
      .find('.num-children')
      .should('be.visible')
      .should('have.text', '4')
      .trigger('mouseover')
      .get('.cy-tooltip').should('have.text', 'This event occurred 4 times')
    })

    it('expands all events after clicking arrow', () => {
      cy.contains('GET --- /dup').closest('.command').find('.command-child-container').should('not.exist')
      cy.contains('GET --- /dup')
      .closest('.command')
      .find('.command-expander')
      .click()

      cy.get('.command-name-xhr').should('have.length', 6)
      cy.contains('GET --- /dup').closest('.command').find('.command-child-container')
      .should('be.visible')
      .find('.command').should('have.length', 3)

      cy.percySnapshot()
    })
  })

  context('clicking command', () => {
    it('pins the command', () => {
      cy.spy(runner, 'emit')
      cy.get('.command:nth-child(2)')
      .should('contain', '#exists')
      .trigger('mouseover')
      .click()
      .closest('.command')
      .find('.command-wrapper')
      .should('have.class', 'command-is-pinned')
      .find('.command-pin')

      cy.wrap(runner.emit).should('be.calledWith', 'runner:pin:snapshot', 'r3', 2)
      cy.percySnapshot()
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

    it('prints to console', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.wrap(runner.emit).should('be.calledWith', 'runner:console:log', 'r3', 2)
    })

    it('shows the snapshot', () => {
      cy.spy(runner, 'emit')
      cy.contains('#exists').click()
      cy.wrap(runner.emit).should('be.calledWith', 'runner:show:snapshot', 'r3', 2)
    })

    it('unpins after clicking again, does not re-print to the console', () => {
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
      cy.contains('#exists').closest('.command-wrapper')
      .should('not.have.class', 'command-is-pinned')

      cy.contains('#doesnt-exist').closest('.command-wrapper')
      .should('have.class', 'command-is-pinned')
    })
  })

  context('command group', () => {
    const fakeIdForTest = 100000000001
    let groupId

    beforeEach(() => {
      addCommand(runner, {
        name: 'get',
        message: '#my_element',
      })

      groupId = addCommand(runner, {
        id: fakeIdForTest,
        name: 'within',
        type: 'child',
      })

      addCommand(runner, {
        name: 'get',
        message: '#my_nested_element',
        group: groupId,
      })
    })

    context('clicking group', () => {
      it('group is open by default when all nested command have passed', () => {
        addCommand(runner, {
          name: 'log',
          message: 'chained log example',
        })

        cy.contains('chained log example') // ensure test content has loaded

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')
        .click()

        cy.get('.command-name-within')
        .should('not.have.class', 'command-expander-is-open')

        cy.get('.command-name-within')
        .find('.num-children')
        .should('have.text', '1')
        .trigger('mouseover')
        .get('.cy-tooltip').should('have.text', '1 log currently hidden')
        .percySnapshot()
      })

      it('group is open by default when last nested command failed', () => {
        addCommand(runner, {
          name: 'log',
          message: 'chained log example',
          state: 'failed',
          group: groupId,
        })

        cy.contains('chained log example') // ensure test content has loaded

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('.command-name-within')
        .find('.num-children')
        .should('not.exist')
        .percySnapshot()
      })

      it('clicking opens and closes the group', () => {
        cy.get('.command-name-within')
        .find('.num-children')
        .should('not.exist')

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')
        .click()

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('not.have.class', 'command-expander-is-open')
        .closest('.command')
        .find('.num-children')
        .should('exist')
        .should('have.text', '1')

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('not.have.class', 'command-expander-is-open')
        .click()
        .should('have.class', 'command-expander-is-open')

        cy.get('.command-name-within')
        .find('.num-children')
        .should('not.exist')
      })

      it('displays with nested logs', () => {
        const nestedGroupId = addCommand(runner, {
          name: 'nested-within',
          state: 'passed',
          type: 'child',
          group: groupId,
        })

        addCommand(runner, {
          name: 'get',
          message: '#my_element_nested',
          state: 'passed',
          groupLevel: 2,
          group: nestedGroupId,
        })

        addCommand(runner, {
          name: 'assert',
          type: 'child',
          message: 'has class named .omg',
          groupLevel: 2,
          group: nestedGroupId,
        })

        addCommand(runner, {
          name: 'log',
          message: 'chained log example',
          state: 'passed',
          group: groupId,
        })

        cy.get('.command-name-within')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')

        cy.get('.command-name-nested-within')
        .find('.command-expander')
        .should('have.class', 'command-expander-is-open')
        .click()

        cy.get('.command-name-nested-within')
        .find('.command-expander')
        .should('not.have.class', 'command-expander-is-open')

        cy.get('.command-name-nested-within')
        .find('.num-children')
        .should('have.text', '2')
        .trigger('mouseover')
        .get('.cy-tooltip').should('have.text', '2 logs currently hidden')

        cy.get('.command-name-within')
        .find('.command-expander')
        .eq(0)
        .click()

        cy.get('.command-name-within')
        .find('.num-children')
        .should('have.text', '5')
        .trigger('mouseover')
        .get('.cy-tooltip').should('have.text', '5 logs currently hidden')

        cy.percySnapshot()
      })

      describe('session group', () => {
        it('closed when nested logs that pass', () => {
          const nestedGroupId = addCommand(runner, {
            name: 'session',
            state: 'passed',
            type: 'child',
          })

          addCommand(runner, {
            name: 'get',
            message: 'do something',
            state: 'passed',
            groupLevel: 1,
            group: nestedGroupId,
          })

          const nestedSessionGroupId = addCommand(runner, {
            name: 'session',
            displayName: 'validate',
            type: 'child',
            groupLevel: 2,
            group: nestedGroupId,
          })

          addCommand(runner, {
            name: 'log',
            message: 'inside of group',
            state: 'passed',
            group: nestedSessionGroupId,
          })

          cy.get('.command-name-session').eq(0)
          .within(() => {
            cy.get('.num-children').should('not.exist')

            cy.get('.command-expander').eq(0)
            .should('not.have.class', 'command-expander-is-open')
            .click()

            cy.get('.command-name-session')
            .should('contain', 'validate')
            .within(() => {
              cy.get('.num-children').should('not.exist')

              cy.log('nested group that are passing are closed by default')
              cy.get('.command-expander')
              .should('not.have.class', 'command-expander-is-open')
              .click()

              cy.get('.command-expander')
              .should('have.class', 'command-expander-is-open')
            })
          })

          cy.percySnapshot()
        })

        it('closed when nested logs has failures but last log is successful', () => {
          const nestedGroupId = addCommand(runner, {
            name: 'session',
            state: 'passed',
            type: 'child',
          })

          addCommand(runner, {
            name: 'get',
            message: 'do something',
            state: 'passed',
            groupLevel: 1,
            group: nestedGroupId,
          })

          const nestedSessionGroupId = addCommand(runner, {
            name: 'session',
            displayName: 'validate',
            type: 'child',
            state: 'failed',
            group: nestedGroupId,
          })

          addCommand(runner, {
            name: 'log',
            message: 'inside of group',
            state: 'failed',
            groupLevel: 2,
            group: nestedSessionGroupId,
          })

          addCommand(runner, {
            name: 'log',
            message: 'inside of group',
            state: 'passed',
            group: nestedGroupId,
          })

          cy.get('.command-name-session').eq(0)
          .within(() => {
            cy.get('.num-children').should('not.exist')

            cy.get('.command-expander').eq(0)
            .should('not.have.class', 'command-expander-is-open')
            .click()

            cy.get('.command-name-session')
            .should('contain', 'validate')
            .within(() => {
              cy.get('.num-children').should('not.exist')

              cy.log('nested group that have failed are open by default')
              cy.get('.command-expander')
              .should('have.class', 'command-expander-is-open')
            })
          })

          cy.percySnapshot()
        })

        it('open when last log has failed', () => {
          const nestedGroupId = addCommand(runner, {
            name: 'session',
            state: 'passed',
            type: 'child',
          })

          addCommand(runner, {
            name: 'get',
            message: 'do something',
            state: 'passed',
            groupLevel: 1,
            group: nestedGroupId,
          })

          const nestedSessionGroupId = addCommand(runner, {
            name: 'session',
            displayName: 'validate',
            state: 'failed',
            type: 'system',
            group: nestedGroupId,
          })

          addCommand(runner, {
            name: 'log',
            message: 'inside of group',
            state: 'failed',
            groupLevel: 2,
            group: nestedSessionGroupId,
          })

          cy.get('.command-name-session').eq(0)
          .within(() => {
            cy.get('.num-children').should('not.exist')

            cy.get('.command-expander').eq(0)
            .should('have.class', 'command-expander-is-open')

            cy.get('.command-name-session')
            .should('contain', 'validate')
            .within(() => {
              cy.get('.num-children').should('not.exist')

              cy.log('nested group that have failed are open by default')
              cy.get('.command-expander')
              .should('have.class', 'command-expander-is-open')
            })
          })

          cy.percySnapshot()
        })
      })
    })

    context('pinning group', () => {
      it('pins the command', () => {
        cy.spy(runner, 'emit')
        cy.get('.command-name-within')
        .find('.command-pin-target')
        .eq(0)
        .trigger('mouseover')
        .click()
        .closest('.command')
        .find('.command-wrapper')
        .should('have.class', 'command-is-pinned')
        .find('.command-pin')

        cy.wrap(runner.emit).should('be.calledWith', 'runner:pin:snapshot', 'r3', fakeIdForTest)
        cy.percySnapshot()
      })

      it('shows a tooltip', () => {
        cy.get('.command-name-within').click('top')
        cy.get('.cy-tooltip').should('have.text', 'Printed output to your console')
      })

      it('tooltip disappears after 1500ms', () => {
        cy.clock()
        cy.get('.command-name-within').click()
        cy.tick(1500)
        cy.get('.cy-tooltip').should('not.exist')
      })

      it('prints to console', () => {
        cy.spy(runner, 'emit')
        cy.get('.command-name-within').click('top')

        cy.wrap(runner.emit).should('be.calledWith', 'runner:console:log', 'r3', fakeIdForTest)
      })

      it('shows the snapshot', () => {
        cy.spy(runner, 'emit')
        cy.get('.command-name-within').click('top')
        cy.wrap(runner.emit).should('be.calledWith', 'runner:show:snapshot', 'r3', fakeIdForTest)
      })

      it('unpins after clicking again, does not re-print to the console', () => {
        cy.spy(runner, 'emit')
        cy.get('.command-name-within').click('top')
        cy.get('.command-name-within').click('top')
        // @ts-ignore
        cy.wrap(runner.emit.withArgs('runner:console:log')).should('be.calledOnce')
      })

      it('unpins after clicking another command, pins that one', () => {
        cy.spy(runner, 'emit')
        cy.get('.command-name-within').click('top')
        cy.contains('#doesnt-exist').click()
        cy.get('.command-name-within')
        .find('.command-wrapper')
        .should('not.have.class', 'command-is-pinned')

        cy.contains('#doesnt-exist').closest('.command-wrapper')
        .should('have.class', 'command-is-pinned')
      })
    })
  })

  context('mousing over', () => {
    beforeEach(() => {
      cy.spy(runner, 'emit')
      cy.clock()
      cy.get('.command-wrapper').first().trigger('mouseover')
    })

    it('shows snapshot after 50ms passes', () => {
      cy.wrap(runner.emit).should('not.be.calledWith', 'runner:show:snapshot')
      cy.tick(50)
      cy.wrap(runner.emit).should('be.calledWith', 'runner:show:snapshot', 'r3', 1)
      cy.wrap(runner.emit).should('be.calledOnce')
    })

    describe('then mousing out', () => {
      beforeEach(() => {
        cy.tick(50)
        cy.get('.command').first().trigger('mouseout')
      })

      it('hides the snapshot after 50ms pass without another mouse over', () => {
        cy.tick(50)
        cy.wrap(runner.emit).should('be.calledWith', 'runner:hide:snapshot', 'r3', 1)
      })

      it('does not hide the snapshot if there is another mouseover before 50ms passes', () => {
        cy.wrap(runner.emit).should('not.be.calledWith', 'runner:hide:snapshot')
      })
    })
  })

  context('test error', () => {
    // this is a unique error permutation currently only observed in cy.session() where an error
    // message should be presented if the session validation fails for a restored session because the
    // session command recover and attempt to recreate a valid session.
    it('renders recovered error for command', () => {
      cy.fixture('command_error').then((_commandErr) => {
        const groupId = addCommand(runner, {
          name: 'session',
          message: 'mock restore',
          state: 'passed',
          type: 'system',
        })

        addCommand(runner, {
          type: 'system',
          name: 'validate',
          state: 'failed',
          err: {
            ..._commandErr,
            isRecovered: true,
          },
          groupLevel: 1,
          group: groupId,
        })

        addCommand(runner, {
          name: 'recreate session',
          message: 'mock recreate session cmd',
          state: 'success',
          type: 'parent',
        })
      })

      cy.contains('CommandError')
      cy.contains('recreate session')
      cy.percySnapshot()
    })

    it('renders recovered error for nested group command', () => {
      cy.fixture('command_error').then((_commandErr) => {
        const groupId = addCommand(runner, {
          name: 'session',
          message: 'mock restore',
          state: 'passed',
          type: 'system',
        })

        const nested = addCommand(runner, {
          type: 'system',
          name: 'validate',
          state: 'failed',
          group: groupId,
        })

        addCommand(runner, {
          number: 8,
          name: 'get',
          message: 'does_not_exist',
          state: 'failed',
          err: {
            ..._commandErr,
            isRecovered: true,
          },
          type: 'parent',
          groupLevel: 2,
          group: nested,
        })

        addCommand(runner, {
          id: 12,
          name: 'recreate session',
          message: 'mock recreate session cmd',
          state: 'success',
          type: 'parent',
        })
      })

      cy.contains('.command', 'validate').as('validate')
      .find('.command-expander')
      .should('have.class', 'command-expander-is-open')

      cy.get('@validate').within(() => {
        cy.contains('CommandError')
      })

      cy.contains('recreate session')

      cy.percySnapshot()
    })
  })

  context('studio commands', () => {
    beforeEach(() => {
      addCommand(runner, {
        id: 10,
        number: 7,
        name: 'get',
        message: '#studio-command-parent',
        state: 'success',
        isStudio: true,
        type: 'parent',
      })

      addCommand(runner, {
        id: 11,
        name: 'click',
        message: '#studio-command-child',
        state: 'success',
        isStudio: true,
        type: 'child',
      })
    })

    it('studio commands have command-is-studio class', () => {
      cy.contains('#studio-command-parent').closest('.command')
      .should('have.class', 'command-is-studio')

      cy.contains('#studio-command-child').closest('.command')
      .should('have.class', 'command-is-studio')
    })

    it('only parent studio commands display remove button', () => {
      cy.contains('#studio-command-parent').closest('.command')
      .find('.studio-command-remove').should('exist')

      cy.contains('#studio-command-child').closest('.command')
      .find('.studio-command-remove').should('not.exist')
    })

    it('emits studio:remove:command with number when delete button is clicked', () => {
      cy.spy(runner, 'emit')

      cy.contains('#studio-command-parent').closest('.command')
      .find('.studio-command-remove').click()

      cy.wrap(runner.emit).should('be.calledWith', 'studio:remove:command', 7)
    })
  })
})
