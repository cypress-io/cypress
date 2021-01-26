import React from 'react'
import { mount } from '../../../npm/react'
import { ColorPalette } from '../../src/ColorPalette'

describe('ColorPalette', () => {
  it('exercises the entire workflow', () => {
    const selectStub = cy.stub()
    mount(
      <ColorPalette 
        selectedColor='red'
        onSelectColor={selectStub}
      />
    )

    cy.get('button[name="red"]').should('have.class', 'cy-draw__palette--button--selected')

    cy.get('button[name="blue"]').click()
    .then(() => {
      expect(selectStub).to.have.been.calledWith('blue')
    })
  })
})