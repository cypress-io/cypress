import { shallow } from 'enzyme'
import React from 'react'
import sinon from 'sinon'

import FlashOnClick from './flash-on-click'

const renderComponent = ({ onClick = (() => {}) }) => {
  return shallow(
    <FlashOnClick message='Some message' onClick={onClick}>
      <div className='content' />
    </FlashOnClick>
  )
}

describe('<FlashOnClick />', () => {
  it('renders a tooltip with the specified message', () => {
    const component = renderComponent({})
    expect(component.find('Tooltip')).to.have.prop('title', 'Some message')
  })

  it('renders a tooltip around the content', () => {
    const component = renderComponent({})
    expect(component.find('Tooltip').find('.content')).to.exist
  })

  describe('clicking content', () => {
    let clock
    let onClick
    let component

    before(() => {
      clock = sinon.useFakeTimers()
    })

    beforeEach(() => {
      onClick = sinon.spy()
      component = renderComponent({ onClick })
      component.find('Tooltip').find('.content').simulate('click')
    })

    after(() => {
      clock.restore()
    })

    it('calls props.onClick', () => {
      expect(onClick).to.have.been.called
    })

    it('shows the tooltip', () => {
      expect(component.find('Tooltip')).to.have.prop('visible', true)
    })

    it('hides the tooltip after 1500ms', () => {
      clock.tick(1500)
      expect(component.update().find('Tooltip')).to.have.prop('visible', false)
    })
  })
})
