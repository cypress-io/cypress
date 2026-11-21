import React from 'react'
import { name as bravoName, words as bravoWords } from '../shared/bravo'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as echoName, words as echoWords } from '../shared/echo'

describe('spec 06', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${bravoName} ${bravoWords.length} ${deltaName} ${deltaWords.length} ${echoName} ${echoWords.length}`}</p>)
    cy.get('p').should('have.text', 'bravo 2500 delta 2500 echo 2500')
  })
})
