import { shallow } from 'enzyme'
import React from 'react'
import sinon from 'sinon'

import Banner from './banner'

describe('<Banner />', () => {
  const eventsStub = { emit: sinon.spy() }
  let component

  beforeEach(() => {
    component = shallow(<Banner events={eventsStub} filePath="fake/file/path" />)
  })

  it('contains configuration changed message', () => {
    expect(component.find('p').first()).to.have.text('You need to restart Cypress after updating configuration files.')
    expect(component.find('code')).to.have.text('fake/file/path')
  })

  it('emits reload configuration event when restart button is clicked', () => {
    const restart = component.find('.restart')

    expect(restart).to.exist
    restart.simulate('click')
    expect(eventsStub.emit).to.have.been.calledWith('reload:configuration')
  })
})
