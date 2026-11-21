import React from 'react'
import { name as charlieName, words as charlieWords } from '../shared/charlie'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as echoName, words as echoWords } from '../shared/echo'

describe('spec 03', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${charlieName} ${charlieWords.length} ${deltaName} ${deltaWords.length} ${echoName} ${echoWords.length}`}</p>)
    cy.get('p').should('have.text', 'charlie 2500 delta 2500 echo 2500')
  })
})
