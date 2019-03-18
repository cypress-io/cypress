import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import Test from './test'

const eventsStub = () => ({
  emit: sinon.spy(),
})

const model = (props) => {
  return _.extend({
    commands: [],
    err: {},
    id: 't1',
    isActive: true,
    level: 1,
    state: 'passed',
    type: 'test',
    shouldRender: true,
    title: 'some title',
  }, props)
}

describe('<Test />', () => {
  it('does not render when it should not render', () => {
    const component = shallow(<Test model={model({ shouldRender: false })} />)

    expect(component).to.be.empty
  })

  it('emits show:error event and stops propagation when error is clicked', () => {
    const events = eventsStub()
    const component = shallow(<Test model={model({ err: { displayMessage: 'some error' } })} events={events} />)
    const e = { stopPropagation: sinon.spy() }

    component.find('FlashOnClick').simulate('click', e)
    expect(events.emit).to.have.been.calledWith('show:error', 't1')
    expect(e.stopPropagation).to.have.been.called
  })

  context('open/closed', () => {
    it('renders without is-open class by default', () => {
      const component = shallow(<Test model={model()} />)

      expect(component).not.to.have.className('is-open')
    })

    it('renders with is-open class when the model state is failed', () => {
      const component = shallow(<Test model={model({ state: 'failed' })} />)

      expect(component).to.have.className('is-open')
    })

    it('renders with is-open class when the model is long running', () => {
      const component = shallow(<Test model={model({ isLongRunning: true })} />)

      expect(component).to.have.className('is-open')
    })

    it('renders with is-open class when there is only one test', () => {
      const component = shallow(<Test model={model({ isLongRunning: true })} />)

      expect(component).to.have.className('is-open')
    })

    context('toggling', () => {
      it('renders without is-open class when already open', () => {
        const component = shallow(<Test model={model({ state: 'failed' })} />)

        component.simulate('click')
        expect(component).not.to.have.className('is-open')
      })

      it('renders with is-open class when not already open', () => {
        const component = shallow(<Test model={model()} />)

        component.simulate('click')
        expect(component).to.have.className('is-open')
      })

      it('renders without is-open class when toggled again', () => {
        const component = shallow(<Test model={model()} />)

        component.simulate('click')
        component.simulate('click')
        expect(component).not.to.have.className('is-open')
      })
    })
  })

  context('contents', () => {
    it('does not render the contents if not open', () => {
      const component = shallow(<Test model={model()} />)

      expect(component.find('.runnable-instruments')).not.to.exist
    })

    it('renders the contents if open', () => {
      const component = shallow(<Test model={model({ state: 'failed' })} />)

      expect(component.find('.runnable-instruments')).to.exist
    })

    it('stops propagation when clicked', () => {
      const component = shallow(<Test model={model({ state: 'failed' })} />)
      const e = { stopPropagation: sinon.spy() }

      component.find('.runnable-instruments').simulate('click', e)
      expect(e.stopPropagation).to.have.been.called
    })
  })
})
