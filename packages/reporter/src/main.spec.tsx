import _ from 'lodash'
import { shallow } from 'enzyme'
import React from 'react'
import sinon, { SinonSpy } from 'sinon'

import { Reporter, ReporterProps } from './main'
import Header from './header/header'
import Runnables from './runnables/runnables'
import { Events } from './lib/events'
import { AppState } from './lib/app-state'

const runnablesStore = {}
const scroller = {}
const statsStore = {}
const error = { title: 'Some error', message: '' }

type AppStateStub = AppState & {
  setAutoScrolling: SinonSpy
}

type ReporterPropsStub = ReporterProps & {
  appState: AppStateStub
}

const getProps = (props?: Partial<ReporterPropsStub>) => {
  return _.extend<ReporterPropsStub>({
    autoScrollingEnabled: true,
    error,
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

type EventsStub = Events & {
  init: SinonSpy
  listen: SinonSpy
}

const eventsStub = () => ({
  init: sinon.spy(),
  listen: sinon.spy(),
} as EventsStub)

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
      appState: { setAutoScrolling: sinon.spy() } as AppStateStub,
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

  it('renders with is-running class when running', () => {
    const props = getProps()

    props.appState.isRunning = true
    const component = shallow(<Reporter {...props} />)

    expect(component).to.have.className('is-running')
  })

  it('renders without is-running class when not running', () => {
    const props = getProps()

    props.appState.isRunning = false
    const component = shallow(<Reporter {...props} />)

    expect(component).not.to.have.className('is-running')
  })

  it('renders the header with the stats store', () => {
    const component = shallow(<Reporter {...getProps()} />)

    expect(component.find(Header)).to.have.prop('statsStore', statsStore)
  })

  it('renders the runnables with the error, runnables store, and spec path', () => {
    const component = shallow(<Reporter {...getProps()} />)

    expect(component.find(Runnables)).to.have.prop('error', error)
    expect(component.find(Runnables)).to.have.prop('runnablesStore', runnablesStore)
    expect(component.find(Runnables)).to.have.prop('specPath', 'the spec path')
  })
})
