import React from 'react'
import { name as deltaName, words as deltaWords } from '../shared/delta'
import { name as echoName, words as echoWords } from '../shared/echo'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 00', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${deltaName} ${deltaWords.length} ${echoName} ${echoWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'delta 2500 echo 2500 foxtrot 2500')
  })
})
