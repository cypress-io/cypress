import React from 'react'
import { mount } from 'enzyme'
import sinon from 'sinon'

import Resizer from './resizer'

const createProps = () => ({
  state: { windowWidth: 600 },
  onResizeStart: sinon.spy(),
  onResize: sinon.spy(),
  onResizeEnd: sinon.spy(),
})

describe('<Resizer />', () => {
  let mousedownEvent

  beforeEach(() => {
    mousedownEvent = { preventDefault: sinon.spy() }
  })

  describe('on resizer mousedown', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      component = mount(<Resizer {...props} />)
      component.simulate('mousedown', mousedownEvent)
    })

    afterEach(() => {
      component.unmount()
    })

    it('prevents default', () => {
      expect(mousedownEvent.preventDefault).to.have.been.called
    })

    it('calls onResizeStart', () => {
      expect(props.onResizeStart).to.have.been.called
    })
  })

  describe('when dragging resizer', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      component = mount(<Resizer {...props} />)
      component.simulate('mousedown', mousedownEvent)
    })

    afterEach(() => {
      component.unmount()
    })

    describe('on document mousemove', () => {
      let mousemoveEvent

      beforeEach(() => {
        mousemoveEvent = new window.Event('mousemove')
        mousemoveEvent.preventDefault = sinon.spy()
        mousemoveEvent.clientX = 425
      })

      it('prevents default', () => {
        document.dispatchEvent(mousemoveEvent)
        expect(mousemoveEvent.preventDefault).to.have.been.called
      })

      it('calls onResize with clientX when within limits', () => {
        document.dispatchEvent(mousemoveEvent)
        expect(props.onResize).to.have.been.calledWith(425)
      })

      it('calls onResize with 0 when clientX is below 0', () => {
        mousemoveEvent.clientX = -20
        document.dispatchEvent(mousemoveEvent)
        expect(props.onResize).to.have.been.calledWith(0)
      })

      it('calls onResize with window width when clientX is above window width', () => {
        mousemoveEvent.clientX = 700
        document.dispatchEvent(mousemoveEvent)
        expect(props.onResize).to.have.been.calledWith(props.state.windowWidth)
      })
    })

    describe('on document mouseup', () => {
      beforeEach(() => {
        document.dispatchEvent(new window.Event('mouseup'))
      })

      it('calls onResizeEnd', () => {
        expect(props.onResizeEnd).to.have.been.called
      })
    })
  })

  describe('when not dragging resizer', () => {
    let props
    let component

    beforeEach(() => {
      props = createProps()
      component = mount(<Resizer {...props} />)
    })

    afterEach(() => {
      component.unmount()
    })

    describe('on document mousemove', () => {
      let mousemoveEvent

      beforeEach(() => {
        mousemoveEvent = new window.Event('mousemove')
        mousemoveEvent.preventDefault = sinon.spy()
        mousemoveEvent.clientX = 425
      })

      it('does not prevent default', () => {
        document.dispatchEvent(mousemoveEvent)
        expect(mousemoveEvent.preventDefault).not.to.have.been.called
      })

      it('does not call onResize', () => {
        document.dispatchEvent(mousemoveEvent)
        expect(props.onResize).not.to.have.been.called
      })
    })

    describe('on document mouseup', () => {
      beforeEach(() => {
        document.dispatchEvent(new window.Event('mouseup'))
      })

      it('does not call onResizeEnd', () => {
        expect(props.onResizeEnd).not.to.have.been.called
      })
    })
  })
})
