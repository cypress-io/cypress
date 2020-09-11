import * as React from 'react'
import { LazyComponent } from './LazyComponent'
import { mount } from 'cypress-react-unit-test'

describe.skip('React.lazy component with <Suspense />', () => {
  it('renders and retries till component is loaded', () => {
    mount(<LazyComponent />)
    cy.contains('loading...')
    cy.contains('Your dog is')
  })
})
