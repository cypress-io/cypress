import * as React from 'react'
import { mount } from '@cypress/react'

import { SearchInput } from './SearchInput'

describe('SearchInput', () => {
  it('renders', () => {
    mount(<SearchInput placeholder="foo" inputRef={{} as any} />)
    cy.get('nav').should('exist')
  })
})
