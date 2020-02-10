import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import AutomationDisconnected from './automation-disconnected'

describe('<AutomationDisconnected />', () => {
  it('renders the message', () => {
    const component = shallow(<AutomationDisconnected />)

    expect(component.find('p').first()).to.have.text('Whoops, the Cypress extension has disconnected.')
  })

  it('calls onReload when button is clicked', () => {
    const onReload = sinon.spy()
    const component = shallow(<AutomationDisconnected onReload={onReload} />)

    component.find('button').simulate('click')
    expect(onReload).to.have.been.called
  })
})
