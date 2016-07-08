import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'

import Command from './command'

const model = (props) => {
  return _.extend({
    alias: 'fooAlias',
    aliasType: 'dom',
    event: false,
    message: 'The message',
    name: 'The name',
    number: 1,
    numElements: 0,
  }, props)
}

describe('<Command />', () => {
  it('renders the number', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('.command-number')).to.have.text('1')
  })

  it('renders the name', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('.command-method')).to.have.text('The name')
  })

  it('renders the display name if specified', () => {
    const component = shallow(<Command model={model({ displayName: 'The displayed name' })} />)
    expect(component.find('.command-method')).to.have.text('The displayed name')
  })

  it('renders the name or display name in parentheses if an event', () => {
    const component = shallow(<Command model={model({ event: true })} />)
    expect(component.find('.command-method')).to.have.text('(The name)')
  })

  it('renders the alias', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('.command-alias')).to.have.text('fooAlias')
  })

  it('renders the alias with the alias type as a class', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('.command-alias')).to.have.className('dom')
  })

  it('renders a tooltip for the alias', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('Tooltip').first().find('.command-alias')).to.exist
  })

  it('renders the alias tooltip with the right title', () => {
    const component = shallow(<Command model={model()} />)
    expect(component.find('Tooltip').first()).to.have.prop('title', "The message aliased as: 'fooAlias'")
  })

  it('renders a tooltip for the invisible indicator', () => {
    const component = shallow(<Command model={model({ visible: false })} />)
    expect(component.find('Tooltip').at(1).find('.command-invisible')).to.exist
  })

  it('renders the invisible indicator tooltip with the right title', () => {
    const component = shallow(<Command model={model({ visible: false })} />)
    expect(component.find('Tooltip').at(1)).to.have.prop('title', 'This element is not visible.')
  })

  it('renders the number of elements', () => {
    const component = shallow(<Command model={model({ numElements: 3 })} />)
    expect(component.find('.command-num-elements')).to.have.text('3')
  })

  it('renders a tooltip for the number of elements', () => {
    const component = shallow(<Command model={model({ numElements: 3 })} />)
    expect(component.find('Tooltip').at(2).find('.command-num-elements')).to.exist
  })

  it('renders the number of elements tooltip with the right title', () => {
    const component = shallow(<Command model={model({ numElements: 3 })} />)
    expect(component.find('Tooltip').at(2)).to.have.prop('title', '3 matched elements')
  })
})
