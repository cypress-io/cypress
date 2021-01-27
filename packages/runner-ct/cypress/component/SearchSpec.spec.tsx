import React from 'react'
import { mount } from '@cypress/react'
import { SearchSpec } from '../../src/SearchSpec'

describe('SpecList', () => {
  it('selected and non selected spec', () => {
    const onSearchStub = cy.stub()
    mount(
      <SearchSpec 
        value=''
        onSearch={onSearchStub}
      />
    )

    cy.get('input').type('f')
      .then(() => {
        expect(onSearchStub).to.have.been.calledWith('f')
      })
  })
})