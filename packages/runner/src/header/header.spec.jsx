import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import driver from '@packages/driver'
import Tooltip from '@cypress/react-tooltip'

import selectorPlaygroundModel from '../selector-playground/selector-playground-model'

import Header from './header'

driver.$ = () => ({ outerHeight: () => 42 })

const getState = (props) => _.extend({
  defaults: {},
  updateWindowDimensions: sinon.spy(),
}, props)

describe('<Header />', () => {
  it('has showing-selector-playground class if selector playground is open', () => {
    selectorPlaygroundModel.isOpen = true
    expect(shallow(<Header state={getState()} />)).to.have.className('showing-selector-playground')
  })

  it('does not showing-selector-playground class if selector playground is disabled', () => {
    selectorPlaygroundModel.isOpen = false
    expect(shallow(<Header state={getState()} />)).not.to.have.className('showing-selector-playground')
  })

  describe('selector playground button', () => {
    it('is disabled if tests are loading', () => {
      const component = shallow(<Header state={getState({ isLoading: true })} />)
      expect(component.find('.selector-playground-toggle')).to.be.disabled
    })

    it('is disabled if tests are running', () => {
      const component = shallow(<Header state={getState({ isRunning: true })} />)
      expect(component.find('.selector-playground-toggle')).to.be.disabled
    })

    it('toggles the selector playground on click', () => {
      selectorPlaygroundModel.toggleOpen = sinon.spy()
      const component = shallow(<Header state={getState()} />)
      component.find('.selector-playground-toggle').simulate('click')
      expect(selectorPlaygroundModel.toggleOpen).to.be.called
    })

    it('updates window dimensions after selector playground is toggled', () => {
      selectorPlaygroundModel.isOpen = false
      const state = getState()
      const component = shallow(<Header state={state} />)
      selectorPlaygroundModel.isOpen = true
      component.update()
      expect(state.updateWindowDimensions).to.be.calledWith({ headerHeight: 42 })
    })

    it('does not show tooltip if selector playground is open', () => {
      selectorPlaygroundModel.isOpen = true
      const component = shallow(<Header state={getState()} />)
      expect(component.find(Tooltip)).to.have.prop('visible', false)
    })

    it('uses default tooltip visibility if selector playground is closed', () => {
      selectorPlaygroundModel.isOpen = false
      const component = shallow(<Header state={getState()} />)
      expect(component.find(Tooltip)).to.have.prop('visible', null)
    })
  })

  describe('url', () => {
    it('has loading class when loading url', () => {
      const component = shallow(<Header state={getState({ isLoadingUrl: true })} />)
      expect(component.find('.url-container')).to.have.className('loading')
    })

    it('has highlighted class when url is highlighted', () => {
      const component = shallow(<Header state={getState({ highlightUrl: true })} />)
      expect(component.find('.url-container')).to.have.className('highlighted')
    })

    it('displays url', () => {
      const component = shallow(<Header state={getState({ url: 'the://url' })} />)
      expect(component.find('.url')).to.have.value('the://url')
    })

    it('opens url when clicked', () => {
      sinon.stub(window, 'open')
      const component = shallow(<Header state={getState({ url: 'the://url' })} />)
      component.find('.url').simulate('click')
      expect(window.open).to.be.calledWith('the://url')
    })
  })

  describe('viewport info', () => {
    it('has open class on button click', () => {
      const component = shallow(<Header state={getState()} />)
      component.find('.viewport-info button').simulate('click')
      expect(component.find('.viewport-info')).to.have.className('open')
    })

    it('displays width, height, and display scale', () => {
      const state = { width: 1, height: 2, displayScale: 3 }
      const component = shallow(<Header state={getState(state)} />)
      expect(component.find('.viewport-info button').text()).to.contain('1 x 2 (3%)')
    })

    it('displays default width and height in menu', () => {
      const state = { defaults: { width: 4, height: 5 } }
      const component = shallow(<Header state={getState(state)} />)
      expect(component.find('.viewport-menu pre').text()).to.contain('"viewportWidth": 4')
      expect(component.find('.viewport-menu pre').text()).to.contain('"viewportHeight": 5')
    })
  })
})
