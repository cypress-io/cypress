import React from 'react'
import { mount } from '../../../npm/react'
import { Toolbar } from '../../src/Toolbar'

describe('Toolbar', () => {
  it('verifies all tools are present', () => {
    const onSelectShape = cy.stub()
    mount(<Toolbar onSelectShape={onSelectShape} />)
    cy.get('button').contains('Rect')
    cy.get('button').contains('Pen')
  })

  it('selects a tool', () => {
    const onSelectShape = cy.stub()
    mount(<Toolbar onSelectShape={onSelectShape} />)
    cy.get('button')
      .contains('Rect')
      .click()
      .then(() => {
        expect(onSelectShape).to.have.been.calledWith('rect')
      })
  })
})