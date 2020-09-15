import React from 'react'
import { shallow } from 'enzyme'
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

    expect(component.find('.collapsible-header-wrapper')).to.have.className('foo')
  })

  it('renders with headerStyle when specified', () => {
    const component = shallow(<Collapsible headerStyle={{ margin: 0 }} />)

    expect(component.find('.collapsible-header-inner')).to.have.style('margin', '0')
  })

  it('renders the header', () => {
    const component = shallow(<Collapsible header={<header>The header</header>} />)

    expect(component.find('.collapsible-header header')).to.have.text('The header')
  })

  it('renders with contentClass on the content when specified', () => {
    const component = shallow(<Collapsible contentClass='bar' />)

    expect(component.find('.collapsible-content')).to.have.className('bar')
  })

  it('opens when clicking header', () => {
    const component = shallow(<Collapsible />)

    component.find('.collapsible-header').simulate('click', { stopPropagation () {} })
    expect(component).to.have.className('is-open')
  })

  it('renders the children only when open', () => {
    const component = shallow(<Collapsible><main>A child</main></Collapsible>)

    expect(component.find('.collapsible-content')).not.to.have.text('A child')
    component.find('.collapsible-header').simulate('click', { stopPropagation () {} })
    expect(component.find('.collapsible-content main')).to.have.text('A child')
  })

  it('closes when clicking header twice', () => {
    const component = shallow(<Collapsible />)

    component.find('.collapsible-header').simulate('click', { stopPropagation () {} })
    component.find('.collapsible-header').simulate('click', { stopPropagation () {} })
    expect(component).not.to.have.className('is-open')
  })
})
