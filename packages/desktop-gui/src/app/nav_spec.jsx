import React from 'react'
import Nav from './nav'
import { mount } from '@cypress/react'
import '../main.scss'

describe('Nav', () => {
  it('renders', () => {
    mount(<Nav />)
  })
})
