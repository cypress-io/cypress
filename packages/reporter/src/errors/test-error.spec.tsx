import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon, { SinonSpy } from 'sinon'

import TestModel from '../test/test-model'
import { Events } from '../lib/events'

import TestError from './test-error'
import ErrModel from '../lib/err-model'

type EventsStub = Events & {
  emit: SinonSpy
}

const eventsStub = () => ({
  emit: sinon.spy(),
} as EventsStub)

const model = (props: Partial<TestModel>) => {
  return _.extend<TestModel>({
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
      const component = shallow(<TestError model={model({ err: { displayMessage: 'some error' } as ErrModel })} events={events} />)
      const e = {
        stopPropagation: sinon.spy(),
      }

      component.find('FlashOnClick').simulate('click', e)
      expect(events.emit).to.have.been.calledWith('show:error', 't1')
      expect(e.stopPropagation).to.have.been.called
    })
  })
})
