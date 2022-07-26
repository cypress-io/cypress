import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'
import { Dialog } from '@reach/dialog'

import { createEventManager } from '../../test/utils'
import { StudioModals, StudioInstructionsModal, StudioInitModal, StudioSaveModal } from './studio-modals'

describe('<StudioModals />', () => {
  let eventManager

  beforeEach(() => {
    eventManager = createEventManager()
    sinon.stub(eventManager, 'emit')
  })

  afterEach(() => {
    eventManager.studioRecorder.cancel()

    sinon.restore()
  })

  it('renders init and save modals', () => {
    const component = shallow(<StudioModals eventManager={eventManager} />)

    expect(component.find(StudioInitModal)).to.exist
    expect(component.find(StudioSaveModal)).to.exist
  })

  describe('<StudioInstructionsModal />', () => {
    it('passes open prop to dialog', () => {
      const component = shallow(<StudioInstructionsModal open={false} close={sinon.stub()} />)

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
      const component = shallow(<StudioInitModal eventManager={eventManager} />)

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('is open and closes with studio recorder variable', () => {
      eventManager.studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal eventManager={eventManager} />)

      expect(component.find(Dialog)).to.have.prop('isOpen', true)

      eventManager.studioRecorder.closeInitModal()

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('closes and clears studio runnable ids when close is clicked', () => {
      sinon.stub(eventManager.studioRecorder, 'clearRunnableIds')
      eventManager.studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal eventManager={eventManager} />)

      component.find('.close-button').simulate('click')

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
      expect(eventManager.studioRecorder.initModalIsOpen).to.equal(false)
      expect(eventManager.studioRecorder.clearRunnableIds).to.be.called
    })

    it('emits studio:start when start button is clicked', () => {
      eventManager.studioRecorder.initModalIsOpen = true
      const component = shallow(<StudioInitModal eventManager={eventManager} />)

      component.find('.btn-main').simulate('click')

      expect(eventManager.emit).to.be.calledWith('studio:start')
    })
  })

  describe('<StudioSaveModal />', () => {
    it('is not open by default', () => {
      const component = shallow(<StudioSaveModal eventManager={eventManager} />)

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('is open and closes with studio recorder variable', () => {
      eventManager.studioRecorder.saveModalIsOpen = true
      const component = shallow(<StudioSaveModal eventManager={eventManager} />)

      expect(component.find(Dialog)).to.have.prop('isOpen', true)

      eventManager.studioRecorder.closeSaveModal()

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
    })

    it('closes when close is clicked', () => {
      eventManager.studioRecorder.saveModalIsOpen = true
      const component = shallow(<StudioSaveModal eventManager={eventManager} />)

      component.find('.close-button').simulate('click')

      expect(component.find(Dialog)).to.have.prop('isOpen', false)
      expect(eventManager.studioRecorder.saveModalIsOpen).to.equal(false)
    })

    context('form', () => {
      beforeEach(() => {
        sinon.stub(eventManager.studioRecorder, 'save')

        eventManager.studioRecorder.saveModalIsOpen = true
      })

      it('updates input when typed into', () => {
        const component = shallow(<StudioSaveModal eventManager={eventManager} />)

        component.find('input').simulate('change', { target: { value: 'my test name' } })

        expect(component.find('input')).to.have.prop('value', 'my test name')
      })

      it('calls studio recorder save with inputted text on submit', () => {
        const component = shallow(<StudioSaveModal eventManager={eventManager} />)

        component.find('input').simulate('change', { target: { value: 'my test name' } })

        expect(component.find('.btn-main')).to.have.prop('disabled', false)

        component.find('form').simulate('submit', { preventDefault: () => {} })

        expect(eventManager.studioRecorder.save).to.be.calledWith('my test name')
      })

      it('disables form when there is no input', () => {
        const component = shallow(<StudioSaveModal eventManager={eventManager} />)

        expect(component.find('.btn-main')).to.have.prop('disabled', true)

        component.find('form').simulate('submit', { preventDefault: () => {} })

        expect(eventManager.studioRecorder.save).not.to.be.called
      })
    })
  })
})
