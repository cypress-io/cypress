import React from 'react'
import { name as bravoName, words as bravoWords } from '../shared/bravo'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 05', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${bravoName} ${bravoWords.length} ${deltaName} ${deltaWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'bravo 2500 delta 2500 foxtrot 2500')
  })
})
