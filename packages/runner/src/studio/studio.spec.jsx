import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Tooltip from '@cypress/react-tooltip'

import Studio from './studio'
import { StudioInstructionsModal } from './studio-modals'
import eventManager from '../lib/event-manager'

const createModel = (props) => {
  return {
    isActive: false,
    isLoading: false,
    reset: sinon.stub(),
    startSave: sinon.stub(),
    ...props,
  }
}

describe('<Studio />', () => {
  context('icon', () => {
    it('is not active when studio is not active', () => {
      const component = shallow(<Studio model={createModel({ isActive: false })} />)

      expect(component.find('.icon')).not.to.have.className('is-active')
    })

    it('is not active when there is no url', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} hasUrl={false} />)

      expect(component.find('.icon')).not.to.have.className('is-active')
    })

    it('is active when studio is active and there is a url', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} hasUrl={true} />)

      expect(component.find('.icon')).to.have.className('is-active')
    })

    it('is not active when test has failed', () => {
      const component = shallow(<Studio model={createModel({ isActive: true, isFailed: true })} hasUrl={true} />)

      expect(component.find('.icon')).not.to.have.className('is-active')
    })
  })

  context('header links', () => {
    it('does not show modal by default', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} />)

      expect(component.find(StudioInstructionsModal)).to.have.prop('open', false)
    })

    it('shows model when available commands is clicked', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} />)

      component.find('.available-commands').simulate('click', { preventDefault: () => {} })

      expect(component.find(StudioInstructionsModal)).to.have.prop('open', true)
    })

    it('disables available commands link while loading', () => {
      const component = shallow(<Studio model={createModel({ isLoading: true })} />)

      expect(component.find('.available-commands')).to.have.className('link-disabled')

      component.find('.available-commands').simulate('click', { preventDefault: () => {} })

      expect(component.find(StudioInstructionsModal)).to.have.prop('open', false)
    })

    it('disables feedback link while loading', () => {
      const component = shallow(<Studio model={createModel({ isLoading: true })} />)

      expect(component.find('.give-feedback')).to.have.className('link-disabled')
      expect(component.find('.give-feedback')).not.to.have.prop('href')
    })
  })

  context('controls', () => {
    beforeEach(() => {
      sinon.stub(eventManager, 'emit')
    })

    afterEach(() => {
      sinon.restore()
    })

    it('disables all controls while studio is loading', () => {
      const component = shallow(<Studio model={createModel({ isLoading: true })} />)

      expect(component.find('.button-studio-close')).to.have.prop('disabled', true)
      expect(component.find('.button-studio-restart')).to.have.prop('disabled', true)
      expect(component.find('.button-studio-save')).to.have.prop('disabled', true)
    })

    it('renders tooltips', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} />)

      expect(component.find(Tooltip).at(0)).to.have.prop('title', 'Close Studio')
      expect(component.find(Tooltip).at(1)).to.have.prop('title', 'Restart')
      expect(component.find(Tooltip).at(2)).to.have.prop('title', 'Save Test')
    })

    it('hides all tooltips while studio is loading', () => {
      const component = shallow(<Studio model={createModel({ isLoading: true })} />)

      expect(component.find(Tooltip).at(0)).to.have.prop('visible', false)
      expect(component.find(Tooltip).at(1)).to.have.prop('visible', false)
      expect(component.find(Tooltip).at(2)).to.have.prop('visible', false)
    })

    it('emits studio:cancel when close button is clicked', () => {
      const component = shallow(<Studio model={createModel({ isActive: true })} />)

      component.find('.button-studio-close').simulate('click')

      expect(eventManager.emit).to.be.calledWith('studio:cancel')
    })

    it('resets studio recorder and emits restart when restart button is clicked', () => {
      const model = createModel({ isActive: true })
      const component = shallow(<Studio model={model} />)

      component.find('.button-studio-restart').simulate('click')

      expect(model.reset).to.be.called
      expect(eventManager.emit).to.be.calledWith('restart')
    })

    it('starts studio recorder saving when save button is clicked', () => {
      const model = createModel({ isActive: true })
      const component = shallow(<Studio model={model} />)

      component.find('.button-studio-save').simulate('click')

      expect(model.startSave).to.be.called
    })
  })
})
