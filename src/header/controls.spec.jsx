import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Controls from './controls'

const eventsStub = () => ({ emit: sinon.spy() })

const statsStub = (props) => {
  return _.extend({
    isPaused: false,
    isRunning: true,
    nextCommandName: null,
  }, props)
}

describe('<Controls />', () => {
  describe('when running, not paused, and/or without next command', () => {
    let stats
    beforeEach(() => {
      stats = statsStub()
    })

    it('renders stop button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.stop')).to.exist
    })

    it('renders tooltip around stop button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.stop').parent()).to.have.prop('title', 'Stop Running')
    })

    it('emits stop event when stop button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} stats={stats} />)
      component.find('.stop').simulate('click')
      expect(events.emit).to.have.been.calledWith('stop')
    })

    it('does not render paused label', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.paused-label')).not.to.exist
    })

    it('does not render play button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.play')).not.to.exist
    })

    it('does not render restart button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.restart')).not.to.exist
    })

    it('does not render next button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.next')).not.to.exist
    })
  })

  describe('when paused with next command', () => {
    let stats
    beforeEach(() => {
      stats = statsStub({ isPaused: true, nextCommandName: 'next command' })
    })

    it('renders paused label', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.paused-label')).to.exist
    })

    it('renders play button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.play')).to.exist
    })

    it('renders tooltip around play button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.play').parent()).to.have.prop('title', 'Resume')
    })

    it('emits resume event when play button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} stats={stats} />)
      component.find('.play').simulate('click')
      expect(events.emit).to.have.been.calledWith('resume')
    })

    it('renders next button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.next')).to.exist
    })

    it('renders tooltip around next button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.next').parent()).to.have.prop('title', 'Next: \'next command\'')
    })

    it('emits resume event when next button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} stats={stats} />)
      component.find('.next').simulate('click')
      expect(events.emit).to.have.been.calledWith('next')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.stop')).not.to.exist
    })
  })

  describe('when not running', () => {
    let stats
    beforeEach(() => {
      stats = statsStub({ isRunning: false })
    })

    it('renders restart button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.restart')).to.exist
    })

    it('renders tooltip around restart button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.restart').parent()).to.have.prop('title', 'Run All Tests')
    })

    it('emits restart event when restart button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls events={events} stats={stats} />)
      component.find('.restart').simulate('click')
      expect(events.emit).to.have.been.calledWith('restart')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls events={eventsStub()} stats={stats} />)
      expect(component.find('.stop')).not.to.exist
    })
  })
})
