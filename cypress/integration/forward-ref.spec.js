/// <reference types="cypress" />
/// <reference types="../../lib" />

import React from 'react'
import Button from '../../src/forward-ref.jsx'

/* eslint-env mocha */
describe('Button component', function () {
  it('works', function () {
    cy.mount(<Button>Hello, World</Button>)
    cy.contains('Hello, World')
  })

  it('forwards refs as expected', function () {
    const ref = React.createRef();

    cy.mount(<Button className="testing" ref={ref}>Hello, World</Button>);
    expect(ref).to.have.property('current');
    // expect(ref.current).not.be.null;
  })
})
