import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'

import PortalPopper from './portal-popper'

import Tooltip from './tooltip'

const defaultProps = {
  placement: 'top',
  title: 'Do foo',
  visible: false,
}

const createComponent = (props) => (
  <Tooltip {..._.extend({}, defaultProps, props)}>
    <div className='target' />
  </Tooltip>
)

describe('<Tooltip />', () => {
  it('does not render popper if visible is false', () => {
    const component = shallow(createComponent())
    expect(component.find(PortalPopper)).not.to.exist
  })

  it('renders popper if visible is true', () => {
    const component = shallow(createComponent({ visible: true }))
    expect(component.find(PortalPopper)).to.exist
  })

  describe('when visible is not explicitly specified', () => {
    let component
    beforeEach(() => {
      component = shallow(createComponent({ visible: null }))
    })

    it('renders popper on mouse over', () => {
      component.find('.target').simulate('mouseOver')
      expect(component.find(PortalPopper)).to.exist
    })

    it('does not render popper on mouse out', () => {
      component.find('.target').simulate('mouseOver')
      component.find('.target').simulate('mouseOut')
      expect(component.find(PortalPopper)).not.to.exist
    })
  })
})
