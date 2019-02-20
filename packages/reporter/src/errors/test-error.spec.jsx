import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import TestError from './test-error'

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

describe('<TestError />', () => {
  context('errors', () => {
    it('emits show:error event and stops propagation when error is clicked', () => {
      const events = eventsStub()
      const component = shallow(<TestError model={model({ err: { displayMessage: 'some error' } })} events={events} />)
      const e = {
        stopPropagation: sinon.spy(),
        target: {
          tagName: 'PRE',
        },
      }

      component.find('FlashOnClick').simulate('click', e)
      expect(events.emit).to.have.been.calledWith('show:error', 't1')
      expect(e.stopPropagation).to.have.been.called
    })

    it('emits external:open event when link is clicked', () => {
      const events = eventsStub()
      const component = shallow(<TestError model={model({ err: { displayMessage: 'some error' } })} events={events} />)
      const e = {
        stopPropagation: sinon.spy(),
        preventDefault: sinon.spy(),
        target: {
          tagName: 'A',
          href: 'http://example.com',
        },
      }

      component.find('FlashOnClick').simulate('click', e)
      expect(events.emit).to.have.been.calledWith('external:open', 'http://example.com')
      expect(e.preventDefault).to.have.been.called
    })
  })
})
