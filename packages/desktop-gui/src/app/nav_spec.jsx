import React from 'react'
import Nav from './nav'
import { mount } from '@cypress/react'

describe('Nav', () => {
  it('renders', () => {
    mount(<Nav />, {
      stylesheets: '/__root/dist/app.css',
    })
  })
})
