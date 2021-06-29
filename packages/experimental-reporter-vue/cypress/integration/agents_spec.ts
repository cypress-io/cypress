import { EventEmitter } from 'events'
import { RootRunnable } from './../../src/runnables/runnables-store'

describe('agents', () => {
  let runner: EventEmitter
  let runnables: RootRunnable
  let start: Function

  beforeEach(() => {
    cy.fixture('runnables_agents').then((_runnables) => {
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

    start = () => {
      cy.get('.reporter').then(() => {
        runner.emit('runnables:ready', runnables)
        runner.emit('reporter:start', {})
      })

      cy.contains('http://localhost:3000') // ensure test content has loaded
    }
  })

  it('does not display agents if there are no agents', () => {
    // @ts-ignore
    runnables.tests[0].agents = []
    start()

    cy.contains('Spies / Stubs').should('not.be.visible')
  })

  describe('when there are agents', () => {
    it('displays collapsible header with number of agents', () => {
      start()
      cy.contains('Spies / Stubs (3)').should('be.visible')
    })

    it('collapses agents by default', () => {
      start()
      cy.get('.runnable-agents-region .instrument-content').should('not.be.visible')
    })

    it('shows agents after expanding', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.runnable-agents-region .instrument-content').should('be.visible')
      cy.percySnapshot()
    })

    it('displays each of the agents', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').should('have.length', 3)
    })

    it('does not include no-calls class if there is a non-zero callCount', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').first().should('not.have.class', 'no-calls')
    })

    it('includes no-calls class if zero callCount', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').eq(2).should('have.class', 'no-calls')
    })

    it('displays the type', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').eq(0).find('td').first().should('have.text', 'spy')
      cy.get('.agent-item').eq(1).find('td').first().should('have.text', 'stub')
      cy.get('.agent-item').eq(2).find('td').first().should('have.text', 'stub')
    })

    it('displays the function name', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').eq(0).find('td').eq(1).should('have.text', 'get')
      cy.get('.agent-item').eq(1).find('td').eq(1).should('have.text', 'fetch')
      cy.get('.agent-item').eq(2).find('td').eq(1).should('have.text', 'go')
    })

    it('displays alias when singular or multiple, but not when absent', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').eq(0).find('td').eq(2).should('have.text', 'getAlias')
      cy.get('.agent-item').eq(1).find('td').eq(2).should('have.text', 'fetchAlias, gonnaHappenAlias')
      cy.get('.agent-item').eq(2).find('td').eq(2).should('have.text', '')
    })

    it('displays the callCount if non-zero or "-" if zero', () => {
      start()
      cy.contains('Spies / Stubs (3)').click()

      cy.get('.agent-item').eq(0).find('td').eq(3).should('have.text', '1')
      cy.get('.agent-item').eq(1).find('td').eq(3).should('have.text', '3')
      cy.get('.agent-item').eq(2).find('td').eq(3).should('have.text', '-')
    })
  })
})
