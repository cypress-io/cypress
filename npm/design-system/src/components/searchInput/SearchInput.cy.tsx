import * as React from 'react'
import { mount } from '@cypress/react'

import { SearchInput } from './SearchInput'
import { useCallback, useState } from 'react'
import { mountAndSnapshot } from 'util/testing'

describe('SearchInput', () => {
  const StatefulWrapper: React.FC<{onInput?: (input: string) => void}> = ({ onInput }) => {
    const [value, setValue] = useState('')

    const memoedOnInput = useCallback((input: string) => {
      setValue(input)
      onInput?.(input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <SearchInput placeholder="foo" value={value} aria-label="Search" onInput={memoedOnInput} />
  }

  it('should render', () => {
    function onInput () {}
    mountAndSnapshot(<SearchInput placeholder="foo" value="" aria-label="Search" onInput={onInput} />)
    cy.get('input').should('exist')
  })

  it('should pass input to onInput', () => {
    const onInput = cy.stub()

    mount(<StatefulWrapper onInput={onInput} />)

    const string = 'Testing input!'

    cy.get('input').type(string).then(() => {
      expect(onInput).to.be.callCount(string.length)

      for (let i = 0; i < string.length; i++) {
        expect(onInput.getCall(i)).to.be.calledWithExactly(string.slice(0, i + 1))
      }
    })
  })

  describe('Clear button', () => {
    it('should only show when text is present', () => {
      mount(<StatefulWrapper />)

      cy.get('[aria-label="Clear search"]').should('not.exist')

      cy.get('input').type('some input')

      cy.get('[aria-label="Clear search"]').should('exist')

      cy.percySnapshot()
    })

    it('should clear input on click', () => {
      const onInput = cy.stub()

      mount(<SearchInput placeholder="foo" value="a value" aria-label="Search" onInput={onInput} />)

      cy.get('input').should('have.value', 'a value')

      cy.get('[aria-label="Clear search"]').click().then(() => expect(onInput).to.be.calledOnceWith(''))
    })

    it('should focus input on click', () => {
      function onInput () {}
      mount(<SearchInput placeholder="foo" value="a value" aria-label="Search" onInput={onInput} />)

      cy.get('[aria-label="Clear search"]').click()

      cy.get('input').should('be.focused')
    })
  })
})
