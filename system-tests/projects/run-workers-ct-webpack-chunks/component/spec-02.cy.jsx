import React from 'react'
import { name as charlieName, words as charlieWords } from '../shared/charlie'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 02', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${charlieName} ${charlieWords.length} ${deltaName} ${deltaWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'charlie 2500 delta 2500 foxtrot 2500')
  })
})
