import { SignalsInputComponent } from './signals.input.component'
import { createOutputSpy, mount } from 'cypress/angular'

describe('with output spies', () => {
  // regression test for https://github.com/cypress-io/cypress/issues/32137
  it('should emit events on button click', () => {
    mount(SignalsInputComponent, {
      componentProperties: {
        newOutput: createOutputSpy('newOutput'),
        oldOutput: createOutputSpy('oldOutput'),
      },
    })

    cy.get('#test-button').click()
    cy.get('@oldOutput').should('have.been.called')
    cy.get('@newOutput').should('have.been.called')
  })
})
