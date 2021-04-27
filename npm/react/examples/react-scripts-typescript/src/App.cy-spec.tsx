/// <reference path="../cypress/support/index.d.ts" />

import React from 'react'
import { mount } from '@cypress/react'

it('works', () => {
  const click = cy.stub()
  const App = () => {
    return (<button onClick={click}>Button!</button>)
  }

  mount(<App />)
  cy.clickButtonWithText('Button!').then(() => {
    expect(click).to.have.been.calledWith()
  })
})
