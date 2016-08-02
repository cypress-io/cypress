import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'

import Runnables, { NoTests, RunnablesList } from './runnables'

const appStateStub = (props) => {
  return _.extend({
    isRunning: true,
    setAutoScrolling: sinon.spy(),
  }, props)
}

const runnablesStoreStub = (props) => {
  return _.extend({
    isReady: true,
    runnables: [],
  }, props)
}

const scrollerStub = () => ({
  setContainer: sinon.spy(),
})

describe('<Runnables />', () => {
  it('renders <RunnablesList /> when there are runnables', () => {
    const component = shallow(
      <Runnables
        runnablesStore={runnablesStoreStub({ runnables: [{ id: 1 }] })}
        scroller={scrollerStub()}
        specPath=''
      />
    )
    expect(component.find(RunnablesList)).to.exist
  })

  it('renders <NoTests /> when there are no runnables', () => {
    const component = shallow(
      <Runnables
        runnablesStore={runnablesStoreStub()}
        scroller={scrollerStub()}
        specPath=''
      />
    )
    expect(component.find(NoTests)).to.exist
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
    expect(scroller.setContainer).to.have.been.calledWith(component.ref('container').node)
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
    expect(appState.setAutoScrolling).to.have.been.calledWith(false)
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
    expect(appState.setAutoScrolling).not.to.have.been.called
  })

  context('<RunnablesList />', () => {
    it('renders a runnable for each runnable in model', () => {
      const component = shallow(<RunnablesList runnables={[{ id: 1 }, { id: 2 }]} />)
      expect(component.find('Runnable').length).to.equal(2)
    })
  })

  context('<NoTests />', () => {
    it('includes specPath with spaces between /s', () => {
      const component = shallow(<NoTests specPath='/Users/eliza/app/foo_spec.js' />)
      expect(component.find('pre')).to.have.text(' / Users / eliza / app / foo_spec.js')
    })
  })
})
