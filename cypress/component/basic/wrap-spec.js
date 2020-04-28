/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { HelloWorld } from './hello-world.jsx'

it('works by itself', () => {
  mount(<HelloWorld />)
  cy.contains('Hello World!')
})

// NOTE: TypeError: Invalid value used as weak map key
it.skip('works inside a div', () => {
  mount(
    <div>
      <HelloWorld />
    </div>,
  )
  cy.contains('Hello World!')
})
