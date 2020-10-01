/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

// compare these tests to Jest + JSDOM tests
// https://codesandbox.io/s/react-testing-library-demo-forked-z7l2o?file=/src/__tests__/components.js
// enable each test to see it fail correctly
it.skip('Cannot click on a button', () => {
  const mock = cy.stub()
  mount(
    <button style={{ pointerEvents: 'none' }} onClick={mock}>
      No pointer events
    </button>,
  )
  cy.get('button').click()
})

// cannot type because the element has attribute "readonly"
it.skip('does not type into readonly input', () => {
  const ReadonlyInput = () => {
    const [value, setValue] = React.useState('')
    return (
      <input
        aria-label="readonly"
        readOnly
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    )
  }

  mount(<ReadonlyInput />)
  cy.get('input').type('Hello')
})
