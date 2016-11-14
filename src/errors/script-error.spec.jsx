import React from 'react'
import { shallow } from 'enzyme'

import ScriptError from './script-error'

const stateWithError = {
  scriptError: {
    error: 'Error is{newline}this{newline}error',
  },
}

describe('<ScriptError />', () => {
  it('renders nothing when there is no script error', () => {
    const state = { scriptError: null }
    const component = shallow(<ScriptError state={state} />)
    expect(component).to.be.empty
  })

  it('splits the spec path by / and displays it', () => {
    const state = stateWithError
    const component = shallow(<ScriptError state={state} specPath='/foo/bar' />)
    expect(component.find('aside pre').text()).to.include('/ foo / bar')
  })

  it('replaces {newline} placeholders in error stack', () => {
    const state = stateWithError
    const component = shallow(<ScriptError state={state} specPath='/foo/bar' />)
    expect(component.find('main pre').text()).to.include('Error is\nthis\nerror')
  })
})
