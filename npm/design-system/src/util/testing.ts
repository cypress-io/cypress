import { mount } from '@cypress/react'
import type React from 'react'

export const mountAndSnapshot =
(component: React.ReactChild) => {
  mount(component)

  cy.percySnapshot()
}
