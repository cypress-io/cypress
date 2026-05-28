import React from 'react'
import { mount } from '@cypress/react'
import Button from './forward-ref.jsx'

describe('Button component', function () {
  it('works', function () {
    mount(<Button>Hello, World</Button>)
    cy.contains('Hello, World')
  })

  it('forwards refs as expected', function () {
    const ref = React.createRef()

    mount(
      <Button className="testing" ref={ref}>
        Hello, World
      </Button>,
    )

    expect(ref).to.have.property('current')
  })
})
