import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Controls from './controls'

const eventsStub = () => ({ emit: sinon.spy() })

const appStateStub = (props) => {
  return _.extend({
    autoScrollingEnabled: true,
    isPaused: false,
    isRunning: true,
    nextCommandName: null,
    toggleAutoScrolling: sinon.spy(),
  }, props)
}

describe('<Controls />', () => {
  describe('when running, not paused, and/or without next command', () => {
    it('renders toggle auto-scrolling button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.toggle-auto-scrolling')).to.exist
    })

    it('renders toggle auto-scrolling button with auto-scrolling-enabled class when auto-scrolling is enabled', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.toggle-auto-scrolling')).to.have.className('auto-scrolling-enabled')
    })

    it('renders toggle auto-scrolling button without auto-scrolling-enabled class when auto-scrolling is disabled', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub({ autoScrollingEnabled: false })} />)
      expect(component.find('.toggle-auto-scrolling')).not.to.have.className('auto-scrolling-enabled')
    })

    it('renders tooltip around toggle auto-scrolling button with right title when auto-scrolling is enabled', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.toggle-auto-scrolling').parent()).to.have.prop('title', 'Disable Auto-scrolling')
    })

    it('renders tooltip around toggle auto-scrolling button with right title when auto-scrolling is disabled', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub({ autoScrollingEnabled: false })} />)
      expect(component.find('.toggle-auto-scrolling').parent()).to.have.prop('title', 'Enable Auto-scrolling')
    })

    it('toggles appState.autoScrollingEnabled when auto-scrolling button is clicked', () => {
      const appState = appStateStub()
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      component.find('.toggle-auto-scrolling').simulate('click')
      expect(appState.toggleAutoScrolling).to.have.been.called
    })

    it('emits save:state event when auto-scrolling button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} appState={appStateStub()} />)
      component.find('.toggle-auto-scrolling').simulate('click')
      expect(events.emit).to.have.been.calledWith('save:state')
    })

    it('renders stop button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.stop')).to.exist
    })

    it('renders tooltip around stop button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.stop').parent()).to.have.prop('title', 'Stop Running')
    })

    it('emits stop event when stop button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} appState={appStateStub()} />)
      component.find('.stop').simulate('click')
      expect(events.emit).to.have.been.calledWith('stop')
    })

    it('does not render paused label', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.paused-label')).not.to.exist
    })

    it('does not render play button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.play')).not.to.exist
    })

    it('does not render restart button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.restart')).not.to.exist
    })

    it('does not render next button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appStateStub()} />)
      expect(component.find('.next')).not.to.exist
    })
  })

  describe('when paused with next command', () => {
    let appState
    beforeEach(() => {
      appState = appStateStub({ isPaused: true, nextCommandName: 'next command' })
    })

    it('renders paused label', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.paused-label')).to.exist
    })

    it('renders play button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.play')).to.exist
    })

    it('renders tooltip around play button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.play').parent()).to.have.prop('title', 'Resume')
    })

    it('emits resume event when play button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} appState={appState} />)
      component.find('.play').simulate('click')
      expect(events.emit).to.have.been.calledWith('resume')
    })

    it('renders next button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.next')).to.exist
    })

    it('renders tooltip around next button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.next').parent()).to.have.prop('title', 'Next: \'next command\'')
    })

    it('emits resume event when next button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} appState={appState} />)
      component.find('.next').simulate('click')
      expect(events.emit).to.have.been.calledWith('next')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.stop')).not.to.exist
    })
  })

  describe('when not running', () => {
    let appState
    beforeEach(() => {
      appState = appStateStub({ isRunning: false })
    })

    it('renders restart button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.restart')).to.exist
    })

    it('renders tooltip around restart button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.restart').parent()).to.have.prop('title', 'Run all tests')
    })

    it('emits restart event when restart button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} appState={appState} />)
      component.find('.restart').simulate('click')
      expect(events.emit).to.have.been.calledWith('restart')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls events={eventsStub()} appState={appState} />)
      expect(component.find('.stop')).not.to.exist
    })
  })
})
