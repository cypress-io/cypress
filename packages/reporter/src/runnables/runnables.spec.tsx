import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import Runnables, { RunnablesList } from './runnables'
import AnError from '../errors/an-error'
import { AppState } from '../lib/app-state'
import { RunnablesStore } from './runnables-store'
import { Scroller } from '../lib/scroller'
import TestModel from '../test/test-model'

type AppStateStub = AppState & {
  temporarilySetAutoScrolling: SinonSpy
}

const appStateStub = (props?: Partial<AppState>) => {
  return _.extend<AppState>({
    isRunning: true,
    temporarilySetAutoScrolling: sinon.spy(),
  }, props) as AppStateStub
}

const runnablesStoreStub = (props?: Partial<RunnablesStore>) => {
  return _.extend<RunnablesStore>({
    isReady: true,
    runnables: [],
  }, props)
}

type ScrollerStub = Scroller & {
  setContainer: SinonSpy
}

const scrollerStub = () => ({
  setContainer: sinon.spy(),
} as ScrollerStub)

describe('<Runnables />', () => {
  it('renders <RunnablesList /> when there are runnables', () => {
    const component = shallow(
      <Runnables
        runnablesStore={runnablesStoreStub({ runnables: [{ id: 1 }] as TestModel[] })}
        scroller={scrollerStub()}
        specPath=''
      />
    )

    expect(component.find(RunnablesList)).to.exist
  })

  it('renders <AnError /> when there are no runnables', () => {
    const component = shallow(
      <Runnables
        runnablesStore={runnablesStoreStub()}
        scroller={scrollerStub()}
        specPath='/path/to/foo_spec.js'
      />
    )

    expect(component.find(AnError)).to.exist
    expect(component.find(AnError).prop('error')).to.eql({
      title: 'No tests found in your file:',
      link: 'https://on.cypress.io/no-tests-found-in-your-file',
      callout: '/path/to/foo_spec.js',
      message: 'We could not detect any tests in the above file. Write some tests and re-run.',
    })
  })

  it('renders nothing when not ready', () => {
    const component = shallow(
      <Runnables
        runnablesStore={runnablesStoreStub({ isReady: false })}
        scroller={scrollerStub()}
        specPath=''
      />
    )

    expect(component.find('.wrap')).to.be.empty
  })

  it('sets the container on the scroller', () => {
    const scroller = scrollerStub()
    const component = mount(
      <Runnables
        runnablesStore={runnablesStoreStub()}
        scroller={scroller}
        specPath=''
      />
    )

    expect(scroller.setContainer).to.have.been.calledWith(component.ref('container'))
  })

  it('disables auto-scrolling when user scrolls and app is running', () => {
    const appState = appStateStub()
    const scroller = scrollerStub()

    mount(
      <Runnables
        appState={appState}
        runnablesStore={runnablesStoreStub()}
        scroller={scroller}
        specPath=''
      />
    )

    scroller.setContainer.callArg(1)
    expect(appState.temporarilySetAutoScrolling).to.have.been.calledWith(false)
  })

  it('does nothing when user scrolls and app is not running', () => {
    const appState = appStateStub({ isRunning: false })
    const scroller = scrollerStub()

    mount(
      <Runnables
        appState={appState}
        runnablesStore={runnablesStoreStub()}
        scroller={scroller}
        specPath=''
      />
    )

    scroller.setContainer.callArg(1)
    expect(appState.temporarilySetAutoScrolling).not.to.have.been.called
  })

  context('<RunnablesList />', () => {
    it('renders a runnable for each runnable in model', () => {
      const component = shallow(<RunnablesList runnables={[{ id: 1 }, { id: 2 }]} />)

      expect(component.find('Runnable').length).to.equal(2)
    })
  })
})
