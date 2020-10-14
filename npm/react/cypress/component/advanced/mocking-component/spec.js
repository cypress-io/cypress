import React from 'react'
import { mount } from '@cypress/react'
// Component "Contact" has child component "Map" that is expensive to render
import Contact from './contact'
import * as MapModule from './map'

describe('Mock imported component', () => {
  // mock Map component used by Contact component
  // whenever React tries to instantiate using Map constructor
  // call DummyMap constructor
  const DummyMap = (props) => {
    return (
      <div data-testid="map">
      DummyMap {props.center.lat}:{props.center.long}
      </div>
    )
  }

  context('via mocking ES6 default import', () => {
    // recommended
    it('renders stubbed Map', () => {
      // DummyMap component will be called with props and any other arguments
      cy.stub(MapModule, 'default').callsFake(DummyMap)

      cy.viewport(500, 500)
      const center = { lat: 0, long: 0 }

      mount(
        <Contact
          name="Joni Baez"
          email="test@example.com"
          site="http://test.com"
          center={center}
        />,
      )

      cy.contains('Contact Joni Baez via')
      // confirm DummyMap renders "0:0" passed via props
      cy.contains('[data-testid="map"]', '0:0').should('be.visible')
    })
  })
})
