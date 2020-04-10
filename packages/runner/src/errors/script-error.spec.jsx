import React from 'react'
import { shallow } from 'enzyme'

import ScriptError from './script-error'

describe('<ScriptError />', () => {
  it('renders nothing when there is no script error', () => {
    const state = { error: null }
    const component = shallow(<ScriptError {...state} />)

    expect(component).to.be.empty
  })

  it('renders ansi as colors', () => {
    const state = { error: { error: `Webpack Compilation Error
    [0m [90m 11 | [39m    it([32m'is true for actual jquery instances'[39m[33m,[39m () [33m=>[39m [0m
     @ multi ./cypress/integration/dom/jquery_spec.js main[0]` } }
    const component = shallow(<ScriptError {...state} />)
    const { dangerouslySetInnerHTML } = component.props()

    expect(dangerouslySetInnerHTML.__html).eq(`Webpack Compilation Error
     <span style="color:#555"> 11 | <span style="color:#000">    it(<span style="color:#0A0">&apos;is true for actual jquery instances&apos;<span style="color:#000"><span style="color:#A50">,<span style="color:#000"> () <span style="color:#A50">=&gt;<span style="color:#000"> </span></span></span></span></span></span></span></span>
     @ multi ./cypress/integration/dom/jquery_spec.js main[0]`)
  })
})
