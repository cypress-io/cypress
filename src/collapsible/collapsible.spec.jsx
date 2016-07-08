import React from 'react'
import { shallow } from 'enzyme'

import Collapsible from './collapsible'

describe('<Collapsible />', () => {
  it('renders unopen', () => {
    const wrapper = shallow(<Collapsible />)
    expect(wrapper.hasClass('is-open')).to.be.false
  })

  it('renders with is-open class when isOpen is true', () => {
    const wrapper = shallow(<Collapsible isOpen={true} />)
    expect(wrapper.hasClass('is-open')).to.be.true
  })

  it('renders with headerClass when specified', () => {
    const wrapper = shallow(<Collapsible headerClass='foo' />)
    expect(wrapper.find('.foo').length).to.equal(1)
  })
})
