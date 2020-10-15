import * as React from 'react'
import { LazyComponent } from './LazyComponent'
import { mount } from '@cypress/react'

// NOTE: It doesn't work because of chunk splitting issue with webpack
describe.skip('React.lazy component with <Suspense />', () => {
  it('renders and retries till component is loaded', () => {
    mount(<LazyComponent />)
    cy.contains('loading...')
    cy.contains('Your dog is')
  })
})
