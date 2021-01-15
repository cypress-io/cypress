import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'
import driver from '@packages/driver'
import Tooltip from '@cypress/react-tooltip'

import eventManager from '../lib/event-manager'
import selectorPlaygroundModel from '../selector-playground/selector-playground-model'
import studioRecorder from '../studio/studio-recorder'

import Header from './header'
import Studio from '../studio/studio'

const getState = (props) => _.extend({
  defaults: {},
  updateWindowDimensions: sinon.spy(),
}, props)

const propsWithState = (stateProps, configProps = {}) =>
  ({
    state: getState(stateProps),
    config: configProps,
  })

describe('<Header />', () => {
  beforeEach(() => {
    driver.$.returns({ outerHeight: () => 42 })

    sinon.stub(eventManager, 'emit')

    sinon.stub(studioRecorder, 'removeListeners')
    sinon.stub(studioRecorder, 'visitUrl')
  })

  afterEach(() => {
    studioRecorder.cancel()

    sinon.restore()
  })

  it('has showing-selector-playground class if selector playground is open', () => {
    selectorPlaygroundModel.isOpen = true
    expect(shallow(<Header {...propsWithState()} />)).to.have.className('showing-selector-playground')
  })

  it('does not showing-selector-playground class if selector playground is disabled', () => {
    selectorPlaygroundModel.isOpen = false
    expect(shallow(<Header {...propsWithState()} />)).not.to.have.className('showing-selector-playground')
  })

  describe('selector playground button', () => {
    it('is disabled if tests are loading', () => {
      const component = shallow(<Header {...propsWithState({ isLoading: true })} />)

      expect(component.find('.selector-playground-toggle')).to.have.prop('disabled', true)
    })

    it('is disabled if tests are running', () => {
      const component = shallow(<Header {...propsWithState({ isRunning: true })} />)

      expect(component.find('.selector-playground-toggle')).to.have.prop('disabled', true)
    })

    it('is disabled if studio is loading', () => {
      studioRecorder.isLoading = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('.selector-playground-toggle')).to.have.prop('disabled', true)
    })

    it('is disabled if studio is active', () => {
      studioRecorder.isActive = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('.selector-playground-toggle')).to.have.prop('disabled', true)
    })

    it('toggles the selector playground on click', () => {
      selectorPlaygroundModel.toggleOpen = sinon.spy()
      const component = shallow(<Header {...propsWithState()} />)

      component.find('.selector-playground-toggle').simulate('click')
      expect(selectorPlaygroundModel.toggleOpen).to.be.called
    })

    it('updates window dimensions after selector playground is toggled', () => {
      selectorPlaygroundModel.isOpen = false
      const props = propsWithState()

      mount(<Header {...props} />)
      selectorPlaygroundModel.isOpen = true
      expect(props.state.updateWindowDimensions).to.be.calledWith({ headerHeight: 42 })
    })

    it('does not show tooltip if selector playground is open', () => {
      selectorPlaygroundModel.isOpen = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find(Tooltip)).to.have.prop('visible', false)
    })

    it('does not show tooltip if studio is loading', () => {
      studioRecorder.isLoading = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find(Tooltip)).to.have.prop('visible', false)
    })

    it('does not show tooltip if studio is active', () => {
      studioRecorder.isActive = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find(Tooltip)).to.have.prop('visible', false)
    })

    it('uses default tooltip visibility if selector playground is closed', () => {
      selectorPlaygroundModel.isOpen = false
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find(Tooltip)).to.have.prop('visible', null)
    })
  })

  describe('studio component', () => {
    it('is hidden by default', () => {
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('header')).not.to.have.className('showing-studio')
    })

    it('is visible when studio is loading', () => {
      studioRecorder.isLoading = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('header')).to.have.className('showing-studio')
    })

    it('is visible when studio is active', () => {
      studioRecorder.isActive = true
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('header')).to.have.className('showing-studio')
    })

    it('sets hasUrl to false when there is not a url in state', () => {
      const component = shallow(<Header {...propsWithState({ url: '' })} />)

      expect(component.find(Studio)).to.have.prop('hasUrl', false)
    })

    it('sets hasUrl to true when there is a url in state', () => {
      const component = shallow(<Header {...propsWithState({ url: 'the://url' })} />)

      expect(component.find(Studio)).to.have.prop('hasUrl', true)
    })
  })

  describe('url', () => {
    it('has loading class when loading url', () => {
      const component = shallow(<Header {...propsWithState({ isLoadingUrl: true })} />)

      expect(component.find('.url-container')).to.have.className('loading')
    })

    it('has highlighted class when url is highlighted', () => {
      const component = shallow(<Header {...propsWithState({ highlightUrl: true })} />)

      expect(component.find('.url-container')).to.have.className('highlighted')
    })

    it('displays url', () => {
      const component = shallow(<Header {...propsWithState({ url: 'the://url' })} />)

      expect(component.find('.url')).to.have.value('the://url')
    })

    it('opens url when clicked', () => {
      sinon.stub(window, 'open')
      const component = shallow(<Header {...propsWithState({ url: 'the://url' })} />)

      component.find('.url').simulate('click')
      expect(window.open).to.be.calledWith('the://url')
    })

    it('input is read only by default', () => {
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('.url')).to.have.prop('readOnly', true)
    })

    it('does not display popup menu by default', () => {
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('.url-container')).not.to.have.className('menu-open')
    })

    it('does not display menu cover by default', () => {
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find('.menu-cover')).not.to.have.className('menu-cover-display')
    })

    context('studio input', () => {
      beforeEach(() => {
        studioRecorder.isActive = true
      })

      it('input is active when studio is active and has no url', () => {
        const component = shallow(<Header {...propsWithState()} />)

        expect(component.find('.url')).to.have.prop('readOnly', false)
      })

      it('displays popup menu when studio is active and has no url', () => {
        const component = shallow(<Header {...propsWithState()} />)

        expect(component.find('.url-container')).to.have.className('menu-open')
      })

      it('displays menu cover when studio is active and has no url', () => {
        const component = shallow(<Header {...propsWithState()} />)

        expect(component.find('.menu-cover')).to.have.className('menu-cover-display')
      })

      it('is prefilled with the baseUrl', () => {
        const component = shallow(<Header {...propsWithState({}, { baseUrl: 'the://url' })} />)

        expect(component.find('.url')).to.have.prop('value', 'the://url/')
      })

      it('updates when typed into', () => {
        const component = shallow(<Header {...propsWithState()} />)

        component.find('.url').simulate('change', { target: { value: 'the://url' } })

        expect(component.find('.url')).to.have.prop('value', 'the://url')
      })

      it('emits studio:cancel when cancel button is clicked', () => {
        const component = shallow(<Header {...propsWithState()} />)

        component.find('.btn-cancel').simulate('click')

        expect(eventManager.emit).to.be.calledWith('studio:cancel')
      })

      it('disables submit button when there is no input', () => {
        const component = shallow(<Header {...propsWithState()} />)

        expect(component.find('.btn-submit')).to.have.prop('disabled', true)
      })

      it('does not disable submit button when there is a base url but no input', () => {
        const component = shallow(<Header {...propsWithState({}, { baseUrl: 'the://url' })} />)

        expect(component.find('.btn-submit')).to.have.prop('disabled', false)
      })

      it('does not disable submit button after user input', () => {
        const component = shallow(<Header {...propsWithState()} />)

        component.find('.url').simulate('change', { target: { value: 'the://url' } })

        expect(component.find('.btn-submit')).to.have.prop('disabled', false)
      })

      it('visits fully formed http url on submit', () => {
        const component = mount(<Header {...propsWithState()} />)

        component.find('.url').simulate('change', { target: { value: 'http://cypress.io' } })
        component.find('.url-container').simulate('submit')

        expect(studioRecorder.visitUrl).to.be.calledWith('http://cypress.io')
      })

      it('visits fully formed https url on submit', () => {
        const component = mount(<Header {...propsWithState()} />)

        component.find('.url').simulate('change', { target: { value: 'https://cypress.io' } })
        component.find('.url-container').simulate('submit')

        expect(studioRecorder.visitUrl).to.be.calledWith('https://cypress.io')
      })

      it('resets url input after submit', () => {
        const component = mount(<Header {...propsWithState()} />)

        component.find('.url').simulate('change', { target: { value: 'cypress.io' } })
        component.find('.url-container').simulate('submit')

        expect(component.find('.url')).to.have.prop('value', '')
      })
    })
  })

  describe('viewport info', () => {
    it('has menu-open class on button click', () => {
      const component = shallow(<Header {...propsWithState()} />)

      component.find('.viewport-info button').simulate('click')
      expect(component.find('.viewport-info')).to.have.className('menu-open')
    })

    it('displays width, height, and display scale', () => {
      const state = { width: 1, height: 2, displayScale: 3 }
      const component = shallow(<Header {...propsWithState(state)} />)

      expect(component.find('.viewport-info button').text()).to.contain('1 x 2 (3%)')
    })

    it('displays default width and height in menu', () => {
      const state = { defaults: { width: 4, height: 5 } }
      const component = shallow(<Header {...propsWithState(state)} />)

      expect(component.find('.viewport-menu pre').text()).to.contain('"viewportWidth": 4')
      expect(component.find('.viewport-menu pre').text()).to.contain('"viewportHeight": 5')
    })
  })
})
