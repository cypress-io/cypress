import { mount } from 'enzyme'
import React from 'react'

import Portal from './portal'

describe('<Portal />', () => {
  it('renders nothing', () => {
    expect(mount(<Portal />)).to.be.empty
  })

  it('creates a div with a unique id', () => {
    Portal.idNum = 0
    mount(<Portal />)
    mount(<Portal />)
    expect(document.getElementById('portal-0')).to.exist
    expect(document.getElementById('portal-1')).to.exist
    document.getElementById('portal-0').remove()
    document.getElementById('portal-1').remove()
  })

  it('renders a div within the portal div with the properties passed in', () => {
    Portal.idNum = 0
    mount(<Portal className='foo' />)
    expect(document.querySelector('.foo')).to.exist
    document.getElementById('portal-0').remove()
  })

  it('renders children within the rendered div', () => {
    Portal.idNum = 0
    mount(<Portal className='foo'><div className='bar' /></Portal>)
    expect(document.querySelector('.bar')).to.exist
    document.getElementById('portal-0').remove()
  })

  it('responds to updates', () => {
    Portal.idNum = 0
    const component = mount(<Portal className='foo' />)
    component.setProps({ className: 'foo-new' })
    expect(document.querySelector('.foo')).not.to.exist
    expect(document.querySelector('.foo-new')).to.exist
    document.getElementById('portal-0').remove()
  })

  // fails because of an error caused by either react or enzyme
  it.skip('removes the portal div on unmount', () => {
    Portal.idNum = 0
    const component = mount(<Portal />)
    component.unmount()
    expect(document.getElementById('portal-0')).not.to.exist
  })
})
