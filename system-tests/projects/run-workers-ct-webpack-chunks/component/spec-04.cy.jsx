import React from 'react'
import { name as bravoName, words as bravoWords } from '../shared/bravo'
import { name as echoName, words as echoWords } from '../shared/echo'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 04', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${bravoName} ${bravoWords.length} ${echoName} ${echoWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'bravo 2500 echo 2500 foxtrot 2500')
  })
})
