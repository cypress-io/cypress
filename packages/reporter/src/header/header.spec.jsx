import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Header from './header'

const eventsStub = () => ({ emit: sinon.spy() })

describe('<Header />', () => {
  it('renders the focus tests button', () => {
    const component = shallow(<Header />)

    expect(component.find('button')).to.exist
  })

  it('renders a tooltip around focus tests button', () => {
    const component = shallow(<Header />)

    expect(component.find('Tooltip')).to.have.prop('title', 'View All Tests')
  })

  it('emits the focus:tests event when the focus tests button is clicked', () => {
    const events = eventsStub()

    shallow(<Header events={events} />).find('button').simulate('click')
    expect(events.emit).to.have.been.calledWith('focus:tests')
  })
})
