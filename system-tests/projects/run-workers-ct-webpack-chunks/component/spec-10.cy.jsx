import React from 'react'
import { name as alphaName, words as alphaWords } from '../shared/alpha'
import { name as echoName, words as echoWords } from '../shared/echo'
import { name as foxtrotName, words as foxtrotWords } from '../shared/foxtrot'

describe('spec 10', () => {
  it('renders the words it imports', () => {
    cy.mount(<p>{`${alphaName} ${alphaWords.length} ${echoName} ${echoWords.length} ${foxtrotName} ${foxtrotWords.length}`}</p>)
    cy.get('p').should('have.text', 'alpha 2500 echo 2500 foxtrot 2500')
  })
})
