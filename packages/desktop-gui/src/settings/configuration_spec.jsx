import Configuration from './configuration'
import React from 'react'
import { mount } from '@cypress/react'
import '../main.scss'

const TestConfiguration = (props) => (
  <div className="settings">
    <div className="settings-wrapper">
      <div className="settings-config">
        <Configuration project={props.project} />
      </div>
    </div>
  </div>
)

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

    mount(<TestConfiguration project={project} />)

    cy.contains('.key-value-pair-value', 'http://localhost:1234').should('have.class', 'cli')
  })

  it('shows an {} for an empty object', () => {
    const project = {
      resolvedConfig: {
        e2e: {
          value: {},
        },
      },
    }

    mount(<TestConfiguration project={project} />)
    cy.get('[role=treeitem]').contains('e2e:')
    cy.get('[role=treeitem]').contains('{}')
  })
})
