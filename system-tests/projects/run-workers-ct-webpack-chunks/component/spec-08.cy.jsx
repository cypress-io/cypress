import React from 'react'
import { name as bravoName, words as bravoWords } from '../shared/bravo'
import { name as charlieName, words as charlieWords } from '../shared/charlie'
import { name as echoName, words as echoWords } from '../shared/echo'

describe('spec 08', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${bravoName} ${bravoWords.length} ${charlieName} ${charlieWords.length} ${echoName} ${echoWords.length}`}</p>)
    cy.get('p').should('have.text', 'bravo 2500 charlie 2500 echo 2500')
  })
})
