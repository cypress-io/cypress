/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'
import { CustomTheme } from './Chart'

describe('Chart', () => {
  it('shows the chart', () => {
    // Applitools commands like "cy.eyes*"
    // https://www.npmjs.com/package/@applitools/eyes-cypress
    cy.eyesOpen({
      appName: '@cypress/react',
      testName: 'Chart example',
      browser: [
        {
          width: Cypress.config('viewportWidth'),
          height: Cypress.config('viewportHeight'),
          name: 'firefox',
        },
      ],
      // ignore "cy.eyes*" commands when using "cypress open --ct"
      isDisabled: Cypress.config('isInteractive'),
    })

    mount(<CustomTheme />)

    cy.eyesCheckWindow('Chart')
    cy.eyesClose()
  })
})
