import Configuration from './configuration'
import React from 'react'
import { mount } from 'cypress-react-unit-test'

/* global cy */
describe('Configuration', () => {
  it('loads and shows resolved value from cli', () => {
    const project = {
      configFile: false,
      resolvedConfig: {
        baseUrl: {
          value: 'http://localhost:1234',
          from: 'cli',
        },
      },
    }

    // apply additional markup for CSS styles to work
    const TestConfiguration = () => (
      <div className="settings">
        <div className="settings-wrapper">
          <div className="settings-config">
            <Configuration project={project} />
          </div>
        </div>
      </div>
    )

    mount(<TestConfiguration />, {
      stylesheets: '/__root/dist/app.css',
    })

    cy.contains('.key-value-pair-value', 'http://localhost:1234')
    .should('have.class', 'cli')
  })
})
