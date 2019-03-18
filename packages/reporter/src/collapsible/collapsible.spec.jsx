import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Collapsible from './collapsible'

describe('<Collapsible />', () => {
  it('renders unopen', () => {
    const component = shallow(<Collapsible />)

    expect(component).not.to.have.className('is-open')
  })

  it('renders with is-open class when isOpen is true', () => {
    const component = shallow(<Collapsible isOpen={true} />)

    expect(component).to.have.className('is-open')
  })

  it('renders with headerClass on the header when specified', () => {
    const component = shallow(<Collapsible headerClass='foo' />)

    expect(component.find('.collapsible-header')).to.have.className('foo')
  })

  it('renders with headerStyle when specified', () => {
    const component = shallow(<Collapsible headerStyle={{ margin: 0 }} />)

    expect(component.find('.collapsible-header')).to.have.style({ margin: 0 })
  })

  it('renders the header', () => {
    const component = shallow(<Collapsible header={<header>The header</header>} />)

    expect(component.find('.collapsible-header header')).to.have.text('The header')
  })

  it('renders with contentClass on the content when specified', () => {
    const component = shallow(<Collapsible contentClass='bar' />)

    expect(component.find('.collapsible-content')).to.have.className('bar')
  })

  it('renders the children', () => {
    const component = shallow(<Collapsible><main>A child</main></Collapsible>)

    expect(component.find('.collapsible-content main')).to.have.text('A child')
  })

  it('opens when clicking header', () => {
    const component = shallow(<Collapsible />)

    component.find('.collapsible-header').simulate('click')
    expect(component).to.have.className('is-open')
  })

  it('closes when clicking header twice', () => {
    const component = shallow(<Collapsible />)

    component.find('.collapsible-header').simulate('click')
    component.find('.collapsible-header').simulate('click')
    expect(component).not.to.have.className('is-open')
  })

  it('calls onToggle when toggled', () => {
    const onToggle = sinon.spy()
    const component = shallow(<Collapsible onToggle={onToggle} />)

    component.find('.collapsible-header').simulate('click')
    expect(onToggle).to.have.been.calledWith(true)
    component.find('.collapsible-header').simulate('click')
    expect(onToggle).to.have.been.calledWith(false)
  })
})
