import React from 'react'
import { mount } from '@cypress/react'
import { HelloWorld } from './hello-world.jsx'

it('works by itself', () => {
  mount(<HelloWorld />)
  cy.contains('Hello World!')
})

it('works inside a div', () => {
  mount(
    <div>
      <HelloWorld />
    </div>,
  )

  cy.contains('Hello World!')
})
