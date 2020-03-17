import React, { ReactElement } from 'react'
import { shallow } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import appState from '../lib/app-state'

import Header from './header'
import statsStore from './stats-store'
import { Events } from '../lib/events'

type EventsStub = Events & {
  emit: SinonSpy
}

const eventsStub = () => ({ emit: sinon.spy() } as EventsStub)

describe('<Header />', () => {
  it('renders the focus tests button', () => {
    const component = shallow(<Header appState={appState} statsStore={statsStore} />)

    expect(component.find('button')).to.exist
  })

  it('renders a tooltip around focus tests button', () => {
    const title = shallow(<Header appState={appState} statsStore={statsStore} />)
    .find('Tooltip')
    .prop<ReactElement>('title')

    const component = shallow(title)

    expect(component.text()).to.contain('View All Tests ')
  })

  it('emits the focus:tests event when the focus tests button is clicked', () => {
    const events = eventsStub()

    shallow(<Header events={events} appState={appState} statsStore={statsStore} />).find('button').simulate('click')
    expect(events.emit).to.have.been.calledWith('focus:tests')
  })
})
