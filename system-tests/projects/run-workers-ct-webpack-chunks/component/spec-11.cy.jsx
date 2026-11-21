import React from 'react'
import { name as alphaName, words as alphaWords } from '../shared/alpha'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 11', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${alphaName} ${alphaWords.length} ${deltaName} ${deltaWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'alpha 2500 delta 2500 foxtrot 2500')
  })
})
