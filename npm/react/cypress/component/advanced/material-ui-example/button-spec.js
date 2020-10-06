import React from 'react'
import { mount } from 'cypress-react-unit-test'
import Button from '@material-ui/core/Button'

it('renders a button', () => {
  mount(
    <Button variant="contained" color="primary">
      Hello World
    </Button>,
  )
})
