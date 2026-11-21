import React from 'react'
import { name as bravoName, words as bravoWords } from '../shared/bravo'
import { name as charlieName, words as charlieWords } from '../shared/charlie'
import { name as deltaName, words as deltaWords } from '../shared/delta'

describe('spec 09', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${bravoName} ${bravoWords.length} ${charlieName} ${charlieWords.length} ${deltaName} ${deltaWords.length}`}</p>)
    cy.get('p').should('have.text', 'bravo 2500 charlie 2500 delta 2500')
  })
})
