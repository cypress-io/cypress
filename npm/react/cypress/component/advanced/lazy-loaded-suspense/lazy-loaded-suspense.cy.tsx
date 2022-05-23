import * as React from 'react'
import { LazyComponent } from './LazyComponent'
import { mount } from '@cypress/react'

describe('React.lazy component with <Suspense />', () => {
  it('renders and retries till component is loaded', () => {
    cy.viewport(1000, 1000)
    mount(<LazyComponent />)
    cy.contains('loading...')
    cy.contains('Your dog is')
  })
})
