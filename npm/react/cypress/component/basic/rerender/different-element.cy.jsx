/// <reference types="cypress" />
import React from 'react'
import { mount } from '@cypress/react'

it('should properly handle swapping components', () => {
  const Component1 = ({ input }) => {
    return <div>{input}</div>
  }

  const Component2 = ({ differentProp }) => {
    return <div style={{ backgroundColor: 'blue' }}>{differentProp}</div>
  }

  mount(<Component1 input="0" />).then(({ rerender }) => {
    rerender(<Component2 differentProp="1" />).get('body')
    .should('contain', '1')
    // TODO: Why is this not working?
    // TODO: Valid this will work with React 16~18.
    // .should('not.contain', '0')
  })
})
