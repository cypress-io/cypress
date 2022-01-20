import React from 'react'
import { mount } from '@cypress/react'
import Button from '@material-ui/core/Button'

it('renders a button', () => {
  mount(
    <Button variant="contained" color="primary">
      Hello World
    </Button>,
  )
})

it('renders a button with an icon', () => {
  mount(
    <Button variant="contained" color="primary" startIcon="⛹️">
      Hello World
    </Button>,
  )
})
