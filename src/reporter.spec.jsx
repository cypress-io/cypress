import _ from 'lodash'
import { shallow } from 'enzyme'
import React from 'react'
import sinon from 'sinon'

import Reporter from './reporter'
import Header from './header/header'
import Runnables from './runnables/runnables'

const appState = {}
const runnablesStore = {}
const statsStore = {}
const getProps = (props) => {
  return _.extend({
    runner: { emit: () => {}, on: () => {} },
    specPath: 'the spec path',
    appState,
    runnablesStore,
    statsStore,
  }, props)
}

const eventsStub = () => ({
  init: sinon.spy(),
  listen: sinon.spy(),
})

describe('<Reporter />', () => {
  it('initializes the events with the runnables store and stats store', () => {
    const events = eventsStub()
    shallow(<Reporter {...getProps({ events })} />)
    expect(events.init).to.have.been.calledWith({ appState, runnablesStore, statsStore })
  })

  it('tells events to listen to runner', () => {
    const events = eventsStub()
    const props = getProps({ events })
    shallow(<Reporter {...props} />)
    expect(events.listen).to.have.been.calledWith(props.runner)
  })

  it('renders the header with the stats store', () => {
    const component = shallow(<Reporter {...getProps()} />)
    expect(component.find(Header)).to.have.prop('statsStore', statsStore)
  })

  it('renders the runnables with the runnables store and spec path', () => {
    const component = shallow(<Reporter {...getProps()} />)
    expect(component.find(Runnables)).to.have.prop('runnablesStore', runnablesStore)
    expect(component.find(Runnables)).to.have.prop('specPath', 'the spec path')
  })
})
