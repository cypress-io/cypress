import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Test from './test'

const createModel = (props) => {
  return {
    commands: [],
    err: {},
    id: 't1',
    isActive: true,
    level: 1,
    state: 'passed',
    type: 'test',
    shouldRender: true,
    title: 'some title',
    ...props,
  }
}

describe('<Test />', () => {
  it('does not render when it should not render', () => {
    const component = shallow(<Test model={createModel({ shouldRender: false })} />)

    expect(component).to.be.empty
  })

  context('open/closed', () => {
    it('renders without is-open class by default', () => {
      const component = shallow(<Test model={createModel()} />)

      expect(component).not.to.have.className('is-open')
    })

    it('renders with is-open class when the model is open', () => {
      const component = shallow(<Test model={createModel({ isOpen: true })} />)

      expect(component).to.have.className('is-open')
    })

    context('toggling', () => {

      it('calls toggleMethod on test model', () => {
        const model = createModel({ toggleOpen: sinon.stub() })
        const component = shallow(<Test model={model} />)

        component.simulate('click')
        expect(model.toggleOpen).to.calledOnce
      })

    })
  })

  context('contents', () => {
    it('does not render the contents if not open', () => {
      const component = shallow(<Test model={createModel()} />)

      expect(component.find('.runnable-instruments')).not.to.exist
    })

    it('renders the contents if open', () => {
      const component = shallow(<Test model={createModel({ isOpen: 'failed' })} />)

      expect(component.find('.runnable-instruments')).to.exist
    })

    it('stops propagation when clicked', () => {
      const component = shallow(<Test model={createModel({ isOpen: true })} />)
      const e = { stopPropagation: sinon.spy() }

      component.find('.runnable-instruments').simulate('click', e)
      expect(e.stopPropagation).to.have.been.called
    })
  })
})
