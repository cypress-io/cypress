import React from 'react'
import { mount } from 'cypress/react'

function App () {
  return <h1>Hello world</h1>
}

describe('using legacy mount', () => {
  it('issues a warning encouraging user to update', () => {
    // dont log else we create an endless loop!
    const log = cy.spy(Cypress, 'log').log(false)
    const err = cy.spy(console, 'error')

    mount(<App />).get('h1').contains('Hello world')
    .then(() => {
      const msg = '[cypress/react]: You are using `cypress/react`, which is designed for React <= 17. Consider changing to `cypress/react18`, which is designed for React 18.'
      const warning = log.getCalls().find((call) => call.args[0].name === 'warning')

      expect(warning.lastArg.message).to.eq(msg)
      expect(err).to.have.been.calledWith(msg)
    })
  })
})
