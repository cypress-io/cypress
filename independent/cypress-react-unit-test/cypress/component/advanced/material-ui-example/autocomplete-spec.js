/// <reference types="cypress" />
import { mount } from 'cypress-react-unit-test'
// select example from
// https://material-ui.com/components/autocomplete/

/* eslint-disable no-use-before-define */
import React from 'react'
import TextField from '@material-ui/core/TextField'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { top100Films } from './top-100-movies'

export default function ComboBox() {
  return (
    <Autocomplete
      id="combo-box-demo"
      options={top100Films}
      getOptionLabel={option => option.title}
      style={{ width: 300 }}
      renderInput={params => (
        <TextField {...params} label="Combo box" variant="outlined" fullWidth />
      )}
    />
  )
}

it('finds my favorite movie', () => {
  cy.viewport(500, 700)
  mount(
    <Autocomplete
      id="combo-box-demo"
      options={top100Films}
      getOptionLabel={option => option.title}
      style={{ width: 300 }}
      renderInput={params => (
        <TextField {...params} label="Combo box" variant="outlined" fullWidth />
      )}
    />,
    {
      stylesheets: [
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
      ],
    },
  )

  cy.get('#combo-box-demo').click()
  cy.focused().type('god')
  cy.contains('The Godfather')
    .should('be.visible')
    .and('have.class', 'MuiAutocomplete-option')
    .click()
  cy.get('#combo-box-demo').should('have.value', 'The Godfather')
})
