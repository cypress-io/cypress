import React from 'react'
import { shallow } from 'enzyme'

import BundleError from './bundle-error'

const stateWithError = {
  bundleError: {
    stack: 'Error is{newline}this{newline}error',
  },
}

describe('<BundleError />', () => {
  it('renders nothing when there is no bundle error', () => {
    const state = { bundleError: null }
    const component = shallow(<BundleError state={state} />)
    expect(component).to.be.empty
  })

  it('splits the spec path by / and displays it', () => {
    const state = stateWithError
    const component = shallow(<BundleError state={state} specPath='/foo/bar' />)
    expect(component.find('aside pre').text()).to.include('/ foo / bar')
  })

  it('replaces {newline} placeholders in error stack', () => {
    const state = stateWithError
    const component = shallow(<BundleError state={state} specPath='/foo/bar' />)
    expect(component.find('main pre').text()).to.include('Error is\nthis\nerror')
  })
})
