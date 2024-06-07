import React from 'react'
import { mount } from 'cypress/react'

function App () {
  return <h1>Hello world</h1>
}

describe('using legacy mount', () => {
  it('issues a error telling the user to update', (done) => {
    cy.on('fail', (e) => {
      expect(e.message).to.equal('[cypress/react]: You are using `cypress/react`, which is designed for React <= 17. ReactDOM.render() is no longer supported. You will need to migrate to `cypress/react19`, which is designed for React 19.')
      done()
    })

    // this mount will fail since ReactDOM.render() was removed in React19
    mount(<App />)
  })
})
