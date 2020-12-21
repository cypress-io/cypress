import { EventEmitter } from 'events'

describe('command options', () => {
  let render: Function

  beforeEach(() => {
    const runner = new EventEmitter()

    cy.visit('/').then((win) => {
      render = ({ isInteractive = true }: any = {}) => {
        win.render({
          isInteractive,
          runner,
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        })

        cy.get('.reporter')
        cy.fixture('runnables_command_options').then((runnables) => {
          runner.emit('runnables:ready', runnables)
          runner.emit('reporter:start', {})
        })
      }
    })
  })

  describe('any case', () => {
    beforeEach(() => {
      render()
    })

    it('shows option', () => {
      cy.get('.command-name-click .command-message-options').should('be.visible')
      cy.get('.command-name-scrollIntoView .command-message-options').should('be.visible')
      cy.get('.command-name-clearCookies .command-message-options').should('be.visible')
    })
  })

  describe('interactive mode', () => {
    beforeEach(() => {
      render()
    })

    it('does not auto-expand options', () => {
      cy.get('.command-name-clearCookies .command-message-options .collapsible').should('not.have.class', 'is-open')
    })
  })

  describe('non-interactive mode', () => {
    beforeEach(() => {
      render({ isInteractive: false })
    })

    it('shows options as text in <pre>', () => {
      cy.get('.command-name-clearCookies .command-message-options .collapsible').should('have.class', 'is-open')
    })
  })
})
