import React from 'react'
import { mount } from 'cypress-react-unit-test'
import MaterialUIPickers from './DatePicker'

describe('Material UI date picker', () => {
  it('works', () => {
    mount(<MaterialUIPickers />)
    // confirm the DOM has rendered the widget
    cy.get('#date-picker-inline').should('have.value', '08/18/2014')
    // then take visual snapshot
    cy.percySnapshot('Datepicker initial')

    cy.get('button[aria-label="change date"]').click()
    // confirm the DOM has rendered the widget
    cy.get('.MuiPickersBasePicker-container').should('be.visible')
    // then take visual snapshot
    cy.percySnapshot('Datepicker opened')
  })
})
