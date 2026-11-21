import React from 'react'
import { name as charlieName, words as charlieWords } from '../shared/charlie'
import { name as echoName, words as echoWords } from '../shared/echo'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 01', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${charlieName} ${charlieWords.length} ${echoName} ${echoWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'charlie 2500 echo 2500 foxtrot 2500')
  })
})
