/* global Partial */
import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import { AppState } from '../lib/app-state'
import { Events } from '../lib/events'

import Controls, { Props as ControlProps } from './controls'

type EventsStub = Events & {
  emit: SinonSpy
}

const eventsStub = () => ({ emit: sinon.spy() } as EventsStub)

const appStateStub = (props?: Partial<AppState>) => {
  return _.extend<AppState>({
    autoScrollingEnabled: true,
    isPaused: false,
    isRunning: true,
    nextCommandName: null,
    toggleAutoScrolling: sinon.spy(),
  }, props)
}

const options = (props?: Partial<ControlProps>) => {
  return _.extend<ControlProps>({
    appState: appStateStub(),
    events: eventsStub(),
    isShowingOptions: false,
    onToggleOptions () {},
  }, props)
}

describe('<Controls />', () => {
  describe('when running, not paused, and/or without next command', () => {
    it('renders stop button', () => {
      const component = shallow(<Controls {...options()} />)

      expect(component.find('.stop')).to.exist
    })

    it('renders tooltip around stop button', () => {
      const title = shallow(<Controls {...options()} />)
      .find('.stop')
      .parent()
      .prop('title')

      const component = shallow(title)

      expect(component.text()).to.contain('Stop Running ')
    })

    it('emits stop event when stop button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls {...options({ events })} />)

      component.find('.stop').simulate('click')
      expect(events.emit).to.have.been.calledWith('stop')
    })

    it('does not render paused label', () => {
      const component = shallow(<Controls {...options()} />)

      expect(component.find('.paused-label')).not.to.exist
    })

    it('does not render play button', () => {
      const component = shallow(<Controls {...options()} />)

      expect(component.find('.play')).not.to.exist
    })

    it('does not render restart button', () => {
      const component = shallow(<Controls {...options()} />)

      expect(component.find('.restart')).not.to.exist
    })

    it('does not render next button', () => {
      const component = shallow(<Controls {...options()} />)

      expect(component.find('.next')).not.to.exist
    })
  })

  describe('when paused with next command', () => {
    let appState: AppState

    beforeEach(() => {
      appState = appStateStub({ isPaused: true, nextCommandName: 'next command' })
    })

    it('renders paused label', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.paused-label')).to.exist
    })

    it('renders play button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.play')).to.exist
    })

    it('renders tooltip around play button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.play').parent()).to.have.prop('title', 'Resume')
    })

    it('emits resume event when play button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls {...options({ appState, events })} />)

      component.find('.play').simulate('click')
      expect(events.emit).to.have.been.calledWith('resume')
    })

    it('renders next button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.next')).to.exist
    })

    it('renders tooltip around next button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.next').parent()).to.have.prop('title', 'Next: \'next command\'')
    })

    it('emits resume event when next button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls {...options({ appState, events })} />)

      component.find('.next').simulate('click')
      expect(events.emit).to.have.been.calledWith('next')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.stop')).not.to.exist
    })
  })

  describe('when not running', () => {
    let appState: AppState

    beforeEach(() => {
      appState = appStateStub({ isRunning: false })
    })

    it('renders restart button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.restart')).to.exist
    })

    it('renders tooltip around restart button', () => {
      const title = shallow(<Controls {...options({ appState })} />)
      .find('.restart')
      .parent()
      .prop('title')

      const component = shallow(title)

      expect(component.text()).to.contain('Run All Tests ')
    })

    it('emits restart event when restart button is clicked', () => {
      const events = eventsStub()
      const component = shallow(<Controls {...options({ appState, events })} />)

      component.find('.restart').simulate('click')
      expect(events.emit).to.have.been.calledWith('restart')
    })

    it('does not render stop button', () => {
      const component = shallow(<Controls {...options({ appState })} />)

      expect(component.find('.stop')).not.to.exist
    })
  })
})
