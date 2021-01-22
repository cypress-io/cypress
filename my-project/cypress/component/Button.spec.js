import * as React from 'react'
import { mount } from '../../../npm/react/dist'
import { Button } from '../../src/Components'

it('Button', () => {
  mount(<Button>Test button</Button>)
  cy.get('button').contains('Test button').click()
})