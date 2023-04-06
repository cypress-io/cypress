import React from 'react'
import { mount } from 'cypress/react'

function App () {
  return <h1>Hello world</h1>
}

describe('using legacy mount', () => {
  it('does not warning or log', () => {
    // dont log else we create an endless loop!
    const log = cy.spy(Cypress, 'log').log(false)
    const err = cy.spy(console, 'error')

    mount(<App />).get('h1').contains('Hello world')
    .then(() => {
      const warning = log.getCalls().find((call) => call.args[0].name === 'warning')

      expect(warning).to.be.undefined
      expect(err).not.to.have.been.called
    })
  })
})
