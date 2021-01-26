import React from 'react'
import { mount } from '../../../npm/react'
import { App } from '../../src/App'

describe('App', () => {
  it('exercises the entire workflow', () => {
    mount(<App />)
  })
})