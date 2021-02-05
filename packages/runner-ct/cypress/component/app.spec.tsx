/* global cy */

import { action, observable } from 'mobx'
import React from 'react'
import { mount } from '@cypress/react'
import App from '../../src/app/app'
import State from '../../src/lib/state'

describe('App', () => {
  it('closes the spec list when selecting a spec', () => {
    class UpdatedState extends State {
      constructor () {
        super({ reporterWidth: 100 })
      }

      specs = observable(
        [
          {
            relative: 'relative',
            absolute: 'absolute',
            name: 'This is a spec',
          },
        ],
      )

      initializePlugins = action(() => { /* stub */ })
      setSingleSpec = action(() => { /* stub */ })
    }

    class EventManager {
      start = () => {}
      on = () => {}
    }

    mount(
      <App
        state={new UpdatedState()}
        // @ts-ignore
        eventManager={new EventManager()}
        config={{ projectName: 'Project' }}
      />,
    )

    cy.get('[role="toggle-menu"]')
    cy.get('[aria-label="Close the menu"]')
    cy.get('[role="unselected-spec"]').contains('This is a spec').click()
    cy.get('[aria-label="Open the menu"]')
  })
})
