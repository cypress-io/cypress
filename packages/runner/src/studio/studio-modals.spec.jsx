import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { Dialog } from '@reach/dialog'

import StudioModals, { StudioInstructionsModal, StudioInitModal, StudioSaveModal } from './studio-modals'
import studioRecorder from './studio-recorder'
import eventManager from '../lib/event-manager'

describe('<StudioModals />', () => {
  beforeEach(() => {
    sinon.stub(eventManager, 'emit')
  })

  afterEach(() => {
    studioRecorder.cancel()

    sinon.restore()
  })

  it('renders init and save modals', () => {
    const component = shallow(<StudioModals />)

    expect(component.find(StudioInitModal)).to.exist
    expect(component.find(StudioSaveModal)).to.exist
  })

  describe('<StudioInstructionsModal />', () => {
    it('passes open prop to dialog', () => {
      const component = shallow(<StudioInstructionsModal open={false} close={() => {}} />)

      expect(component.find(Dialog)).to.have.prop('isOpen', false)

      component.setProps({ open: true })

      expect(component.find(Dialog)).to.have.prop('isOpen', true)
    })

    it('calls close prop on close', () => {
      const close = sinon.stub()
      const component = shallow(<StudioInstructionsModal open={true} close={close} />)

      component.find('.close-button').simulate('click')

      expect(close).to.be.called
    })
  })

  describe('<StudioInitModal />', () => {
    it('is not open by default', () => {
      const component = shallow(<StudioInitModal />)

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('is open and closes with studio recorder variable', () => {
      studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal />)

      expect(component.find(Dialog)).to.have.prop('isOpen', true)

      studioRecorder.closeInitModal()

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('closes and clears studio runnable ids when close is clicked', () => {
      sinon.stub(studioRecorder, 'clearRunnableIds')
      studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal />)

      component.find('.close-button').simulate('click')

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
      expect(studioRecorder.initModalIsOpen).to.equal(false)
      expect(studioRecorder.clearRunnableIds).to.be.called
    })

    it('emits studio:start when start button is clicked', () => {
      studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal />)

      component.find('.btn-main').simulate('click')

      expect(eventManager.emit).to.be.calledWith('studio:start')
    })
  })

  describe('<StudioSaveModal />', () => {
    it('is not open by default', () => {
      const component = shallow(<StudioSaveModal />)

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('is open and closes with studio recorder variable', () => {
      studioRecorder.saveModalIsOpen = true
      const component = shallow(<StudioSaveModal />)

      expect(component.find(Dialog)).to.have.prop('isOpen', true)

      studioRecorder.closeSaveModal()

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('closes when close is clicked', () => {
      studioRecorder.saveModalIsOpen = true
      const component = shallow(<StudioSaveModal />)

      component.find('.close-button').simulate('click')

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
      expect(studioRecorder.saveModalIsOpen).to.equal(false)
    })

    context('form', () => {
      beforeEach(() => {
        sinon.stub(studioRecorder, 'save')

        studioRecorder.saveModalIsOpen = true
      })

      it('updates input when typed into', () => {
        const component = shallow(<StudioSaveModal />)

        component.find('input').simulate('change', { target: { value: 'my test name' } })

        expect(component.find('input')).to.have.prop('value', 'my test name')
      })

      it('calls studio recorder save with inputted text on submit', () => {
        const component = shallow(<StudioSaveModal />)

        component.find('input').simulate('change', { target: { value: 'my test name' } })

        expect(component.find('.btn-main')).to.have.prop('disabled', false)

        component.find('form').simulate('submit', { preventDefault: () => {} })

        expect(studioRecorder.save).to.be.calledWith('my test name')
      })

      it('disables form when there is no input', () => {
        const component = shallow(<StudioSaveModal />)

        expect(component.find('.btn-main')).to.have.prop('disabled', true)

        component.find('form').simulate('submit', { preventDefault: () => {} })

        expect(studioRecorder.save).not.to.be.called
      })
    })
  })
})
