/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import ListItem from '@material-ui/core/ListItem'
import { ListItemText } from '@material-ui/core'
import SimpleList from './list-demo'

it('renders a list item', () => {
  mount(
    <ListItem>
      <ListItemText primary={'my example list item'} />
    </ListItem>,
  )
  cy.contains('my example list item')
})

// demo from https://material-ui.com/components/lists/
it('renders full list', () => {
  cy.viewport(500, 800)
  mount(<SimpleList />)
  cy.contains('Drafts')
    .click()
    .wait(1000)
    .click()
    .wait(1000)
    .click()
})
