/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'
import { CustomTheme } from './Chart'

describe('Chart', () => {
  it('shows the chart', () => {
    // Applitools commands like "cy.eyes*"
    // https://www.npmjs.com/package/@applitools/eyes-cypress
    cy.eyesOpen({
      appName: 'cypress-react-unit-test',
      testName: 'Chart example',
      browser: [
        {
          width: Cypress.config('viewportWidth'),
          height: Cypress.config('viewportHeight'),
          name: 'firefox',
        },
      ],
      // ignore "cy.eyes*" commands when using "cypress open"
      isDisabled: Cypress.config('isInteractive'),
    })

    mount(<CustomTheme />)

    cy.eyesCheckWindow('Chart')
    cy.eyesClose()
  })
})
