import { EventEmitter } from 'events'
import { addLog, updateLog } from '../support/util'

const _ = Cypress._

const makeRunnables = ({ base }, tests) => {
  return _.set(base, 'suites[0].tests', tests)
}

describe('retries', function () {
  beforeEach(function () {
    cy.fixture('retries_data').as('data')

    this.runner = new EventEmitter()

    cy.server()
    cy.route('/foo')

    cy.visit('cypress/support/index.html').then((win) => {

      cy.spy(win, 'btoa')

      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter')

    this.start = (suite) => {
      this.runner.emit('runnables:ready', makeRunnables(this.data, suite))
      this.runner.emit('reporter:start', {})
      this.runner.emit('run:start')
    }

    this.addAttempt = (attempt) => {
      this.runner.emit('test:before:run:async', attempt)
    }

    this.finish = ({ state = 'passed', id = 'r3' } = {}) => {
      this.runner.emit('test:after:run', {
        id,
        state,
        final: true,
      })
    }
  })

  it('does not shows attempts if there are no retries', function () {
    this.start(this.data.singleTestSingleAttempt)
    this.finish()

    // ensure the test is open or the not.be.visible below will be a false positive
    cy.contains('.hook-item', 'test').should('be.visible')
    cy.contains('Attempt 1').should('not.be.visible')
  })

  it('shows attempts after first retry', function () {
    this.start(this.data.singleTestFailedAttempt)
    this.addAttempt(this.data.attempt)
    addLog(this.runner, this.data.command)
    this.finish()

    cy.contains('Attempt 1').should('be.visible')
    cy.contains('Attempt 2').should('be.visible')
  })

  it('attempt shows active indicator when in active state', function () {
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'active'
    this.addAttempt(this.data.attempt)
    this.data.command.state = 'pending'
    addLog(this.runner, this.data.command)

    cy.get('.attempt-item').eq(1).should('have.class', 'attempt-state-active')
  })

  it('attempt shows failed indicator when in failed state', function () {
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'failed'
    this.addAttempt(this.data.attempt)
    this.data.command.state = 'failed'
    addLog(this.runner, this.data.command)
    this.finish()

    cy.get('.attempt-item').eq(1).should('have.class', 'attempt-state-failed')
  })

  it('attempt shows passed indicator when in passed state', function () {
    this.start(this.data.singleTestFailedAttempt)
    this.addAttempt(this.data.attempt)
    addLog(this.runner, this.data.command)
    this.finish()

    cy.get('.attempt-item').eq(1).should('have.class', 'attempt-state-passed')
  })

  it('test has failed state when last attempt has failed', function () {
    this.data.singleTestThreeAttempts[0].state = 'failed'
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy.get('.test').should('have.class', 'runnable-failed')
  })

  it('expands attempts properly', function () {
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy
    .contains('Attempt 1')
    .click()
    .closest('.attempt-item')
    .contains('test')
    .should('be.visible')
  })

  it('collapses attempts properly', function () {
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy
    .contains('Attempt 3')
    .click()
    .closest('.attempt-item')
    .contains('test')
    .should('not.be.visible')
  })

  it('includes routes, spies, hooks, and commands in attempt', function () {
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy
    .contains('Attempt 3')
    .closest('.attempt-item').within(() => {
      cy.contains('Spies / Stubs')
      cy.contains('Routes')
      cy.contains('before each')
      cy.contains('test')
    })
  })

  it('it updates stats as tests finish', function () {
    const assertStats = (passed, failed, pending) => {
      cy.get('.stats .passed .num').should('have.text', passed)
      cy.get('.stats .failed .num').should('have.text', failed)

      return cy.get('.stats .pending .num').should('have.text', pending)
    }

    this.data.singleTestThreeAttempts.push({
      id: 'r4',
      title: 'will fail',
    })
    this.data.singleTestThreeAttempts.push({
      id: 'r5',
      title: 'pending',
      state: 'pending',
    })
    this.start(this.data.singleTestThreeAttempts)

    assertStats('--', '--', '--').then(() => {
      this.finish()
    })
    assertStats('1', '--', '--').then(() => {
      this.finish({ id: 'r4', state: 'failed' })
    })
    assertStats('1', '1', '--').then(() => {
      this.finish({ id: 'r5', state: 'pending' })
    })
    assertStats('1', '1', '1')
  })

  it('shows error in each failed attempt', function () {
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy
    .contains('Attempt 1')
    .click()
    .closest('.attempt-item')
    .find('.attempt-error')
    .should('be.visible')
    .invoke('text')
    .should('include', 'failed to visit')

    cy
    .contains('Attempt 2')
    .click()
    .closest('.attempt-item')
    .find('.attempt-error')
    .should('be.visible')
    .invoke('text')
    .should('include', 'expected <.foo> to have text')
  })

  it('shows tooltip and prints to console when error is clicked', function () {
    cy.spy(this.runner, 'emit')

    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    // non-command errors are logged by test id
    cy
    .contains('Attempt 1')
    .click()
    .closest('.attempt-item')
    .find('.attempt-error')
    .click()

    cy
    .contains('Printed output to your console')
    .then(() => {
      expect(this.runner.emit).to.be.calledWith('runner:console:error', 'r3')
    })

    // command errors are logged by command id
    cy
    .contains('Attempt 2')
    .click()
    .closest('.attempt-item')
    .find('.attempt-error')
    .click()

    cy
    .contains('Printed output to your console')
    .then(() => {
      expect(this.runner.emit).to.be.calledWith('runner:console:log', 'c5')
    })
  })

  it('shows error on test when all retries have failed', function () {
    const lastAttempt = this.data.singleTestThreeAttempts[0]

    lastAttempt.state = 'failed'
    lastAttempt.err = {
      name: 'CypressError',
      message: 'it just totally failed for some reason',
    }
    this.start(this.data.singleTestThreeAttempts)
    this.finish()

    cy.get('.test-error').invoke('text').should('include', lastAttempt.err.message)
  })

  it('auto-opens the test and attempt if the test is long-running', function () {
    // add a 2nd test so the 1st one isn't automatically open
    this.data.singleTestFailedAttempt.push({
      id: 'r4',
      title: 'test 2',
    })
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'active'
    this.addAttempt(this.data.attempt)
    this.data.command.state = null
    addLog(this.runner, this.data.command)
    this.data.command.state = 'pending'
    updateLog(this.runner, this.data.command)

    cy.contains('visit').should('be.visible')
  })

  it('scrolls active attempt into view', function () {
    const tests = this.data.singleTestThreeAttempts

    // add a bunch of tests so scrolling is necessary
    _.times(20, (i) => {
      tests.unshift({
        id: `r${i + 5}`,
        title: 'test',
        state: 'passed',
      })
    })

    this.start(tests)
    this.data.attempt.state = 'active'
    this.data.attempt.attemptIndex = 2
    this.addAttempt(this.data.attempt)
    this.data.command.state = null
    this.data.command.testAttemptIndex = 2
    addLog(this.runner, this.data.command)
    this.data.command.state = 'pending'
    updateLog(this.runner, this.data.command)

    cy.contains('visit').should('be.visible')
  })

  it('updates attempt on test:set:state', function () {
    // add a 2nd test attempt so the 1st ones aren't automatically open
    this.data.singleTestFailedAttempt.push({
      id: 'r4',
      title: 'test 2',
    })
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'active'
    this.addAttempt(this.data.attempt)
    addLog(this.runner, this.data.command)

    cy
    .contains('visit')
    .should('not.be.visible')
    .then(() => {
      this.runner.emit('test:set:state', {
        id: 'r3',
        isOpen: true,
      })

      cy.contains('visit').should('be.visible')
    })
  })

  it('calls test:set:state callback if changes', function () {
    // add a 2nd test attempt so the 1st ones aren't automatically open
    this.data.singleTestFailedAttempt.push({
      id: 'r4',
      title: 'test 2',
    })
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'active'
    this.addAttempt(this.data.attempt)
    addLog(this.runner, this.data.command)

    const cb = cy.spy()

    this.runner.emit('test:set:state', {
      id: 'r3',
      isOpen: true,
    }, cb)

    cy.wrap(cb).should('be.called')
  })

  it('calls test:set:state callback if no changes', function () {
    // add a 2nd test attempt so the 1st ones aren't automatically open
    this.data.singleTestFailedAttempt.push({
      id: 'r4',
      title: 'test 2',
    })
    this.start(this.data.singleTestFailedAttempt)
    this.data.attempt.state = 'active'
    this.addAttempt(this.data.attempt)
    addLog(this.runner, this.data.command)

    const cb = cy.spy()

    this.runner.emit('test:set:state', {
      id: 'r3',
      isOpen: false,
    }, cb)

    cy.wrap(cb).should('be.called')
  })
})
