import _ from 'lodash'
import { shallow } from 'enzyme'
import React from 'react'
import sinon from 'sinon'

import Reporter from './reporter'
import Header from './header/header'
import Runnables from './runnables/runnables'

const runnablesStore = {}
const scroller = {}
const statsStore = {}
const getProps = (props) => {
  return _.extend({
    autoScrollingEnabled: true,
    runner: { emit: () => {}, on: () => {} },
    specPath: 'the spec path',
    appState: {
      setAutoScrolling: sinon.spy(),
    },
    runnablesStore,
    scroller,
    statsStore,
  }, props)
}

const eventsStub = () => ({
  init: sinon.spy(),
  listen: sinon.spy(),
})

describe('<Reporter />', () => {
  it('initializes the events with the app state, runnables store, scroller, and stats store', () => {
    const events = eventsStub()
    const props = getProps({ events })
    shallow(<Reporter {...props} />)
    expect(events.init).to.have.been.calledWith({
      appState: props.appState,
      runnablesStore,
      scroller,
      statsStore,
    })
  })

  it('sets appState.autoScrollingEnabled', () => {
    const props = getProps({
      appState: { setAutoScrolling: sinon.spy() },
      autoScrollingEnabled: false,
    })
    shallow(<Reporter {...props} />)
    expect(props.appState.setAutoScrolling).to.have.been.calledWith(false)
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
