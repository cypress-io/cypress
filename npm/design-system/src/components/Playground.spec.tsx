import React from 'react'
import { CypressLogo } from './CypressLogo/CypressLogo'
import { SearchInput } from './SearchInput/SearchInput'
import { mount } from '@cypress/react'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)
library.add(fab)

describe('Playground', () => {
  it('cypress logo', () => {
    mount(<>
      <CypressLogo size="small" />
      <br/>
      <CypressLogo size="medium" />
      <br/>
      <CypressLogo size="large" />
    </>)
  })

  it('search input', () => {
    const Wrapper = (props) => {
      const [value, setValue] = React.useState(props.value || '')
      const inputRef = React.useRef<HTMLInputElement>(null)

      return (<SearchInput
        prefixIcon={props.prefixIcon}
        onSuffixClicked={() => {
          setValue('')
          inputRef.current.focus()
        }}
        placeholder={props.placeholder}
        inputRef={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}>
      </SearchInput>)
    }

    mount(<>
      <Wrapper placeholder="Find components..." prefixIcon="search" />
      <br/>
      {/* <Wrapper placeholder="Find components..." prefixIcon="coffee"/> */}
      <br/>
      {/* <Wrapper placeholder="Find components..." prefixIcon="search" suffixIcon="times"/> */}
    </>)

    cy.get('input').should('exist')
    cy.get('input').should('exist').first()
    // .its('placeholder').should('be', placeholderText)
    // .click()

    cy.get('input').first().type('Hello World!').clear().type('WHATS UP ⚡️')
    cy.get('input').first().should('contain.value', '⚡️')

    cy.get('input')
    .click()
    .type('hello')
    .get('[data-testid=close]')
    .click()
    .get('input')
    .should('be.focused')
  })
})
