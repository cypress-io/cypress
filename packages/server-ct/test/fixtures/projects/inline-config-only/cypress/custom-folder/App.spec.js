import { createApp } from './App.js'
import { ROOT_ID } from '@cypress/mount-utils'

it('renders', () => {
  createApp(document.getElementById(ROOT_ID))
  cy.get('div').contains('This is the app')
})
