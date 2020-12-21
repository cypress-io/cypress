import { EventEmitter } from 'events'

describe('command options', () => {
  let render: Function

  beforeEach(() => {
    const runner = new EventEmitter()

    cy.visit('/').then((win) => {
      render = () => {
        win.render({
          // isInteractive,
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
})
