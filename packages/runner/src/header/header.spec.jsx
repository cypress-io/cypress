import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import driver from '@packages/driver'

import Header from './header'

const getState = (props) => _.extend({
  defaults: {},
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

  describe('selector playground button', () => {
    it('is disabled if tests are loading', () => {
      const component = shallow(<Header {...propsWithState({ isLoading: true })} />)

      expect(component.find('.selector-playground-toggle')).to.be.disabled
    })

    it('is disabled if tests are running', () => {
      const component = shallow(<Header {...propsWithState({ isRunning: true })} />)

      expect(component.find('.selector-playground-toggle')).to.be.disabled
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

    it('opens url when clicked', () => {
      sinon.stub(window, 'open')
      const component = shallow(<Header {...propsWithState({ url: 'the://url' })} />)

      component.find('.url').simulate('click')
      expect(window.open).to.be.calledWith('the://url')
    })
  })
})
