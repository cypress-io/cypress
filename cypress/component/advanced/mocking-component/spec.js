import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Contact from './contact'
import Map from './map'

it('should render contact information', () => {
  // mock Map component used by Contact component
  // whenever React tries to instantiate using Map constructor
  // call DummyMap constructor
  const DummyMap = props => (
    <div data-testid="map">
      DummyMap {props.center.lat}:{props.center.long}
    </div>
  )
  cy.stub(React, 'createElement')
    .callThrough()
    .withArgs(Map)
    .callsFake((constructor, props) => React.createElement(DummyMap, props))

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
  cy.contains('[data-testid="map"]', '0:0').should('be.visible')
})
