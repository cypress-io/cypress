import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
import sinon from 'sinon'
import driver from '@packages/driver'
import Tooltip from '@cypress/react-tooltip'

import selectorPlaygroundModel from '../selector-playground/selector-playground-model'

import Header from './header'

const getState = (props) => _.extend({
  defaults: {},
  updateWindowDimensions: sinon.spy(),
}, props)

const propsWithState = (props) =>
  ({
    state: getState(props),
    config: {},
  })

describe('<Header />', () => {
  beforeEach(() => {
    driver.$.returns({ outerHeight: () => 42 })
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

      expect(component.find('.selector-playground-toggle')).to.be.disabled
    })

    it('is disabled if tests are running', () => {
      const component = shallow(<Header {...propsWithState({ isRunning: true })} />)

      expect(component.find('.selector-playground-toggle')).to.be.disabled
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

    it('uses default tooltip visibility if selector playground is closed', () => {
      selectorPlaygroundModel.isOpen = false
      const component = shallow(<Header {...propsWithState()} />)

      expect(component.find(Tooltip)).to.have.prop('visible', null)
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
  })

  describe('viewport info', () => {
    it('has open class on button click', () => {
      const component = shallow(<Header {...propsWithState()} />)

      component.find('.viewport-info button').simulate('click')
      expect(component.find('.viewport-info')).to.have.className('open')
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
