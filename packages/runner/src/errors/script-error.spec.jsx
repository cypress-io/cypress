import React from 'react'
import { shallow } from 'enzyme'

import ScriptError from './script-error'

describe('<ScriptError />', () => {
  it('renders nothing when there is no script error', () => {
    const state = { scriptError: null }
    const component = shallow(<ScriptError state={state} />)

    expect(component).to.be.empty
  })
})
