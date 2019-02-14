import _ from 'lodash'
import React from 'react'
import { mount, shallow } from 'enzyme'
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
  // TODO: Believe these are better suited as Cypress tests
  // Waiting for #3188 to be merged in
  context.skip('errors', () => {
    it('emits show:error event and stops propagation when error is clicked', () => {
      const events = eventsStub()
      const component = mount(<TestError model={model({ err: { displayMessage: 'some error' } })} events={events} />)
      const e = { stopPropagation: sinon.spy() }

      component.find('FlashOnClick').simulate('click', e)
      expect(events.emit).to.have.been.calledWith('show:error', 't1')
      expect(e.stopPropagation).to.have.been.called
    })

    it('renders markdown', () => {
      const component = mount(<TestError model={model({ err: { displayMessage: '**markdown**' } })} />)

      expect(component.find('.test-error').prop('dangerouslySetInnerHTML').__html).to.include('<strong>markdown</strong>')
    })

    it('emits external:open and prevents default when link in error message is clicked', () => {
      const events = eventsStub()
      const url = 'http://example.com'
      const component = shallow(<TestError model={model({ err: { displayMessage: url } })} events={events} />)
      const e = { preventDefault: sinon.spy() }

      // component.find('a').simulate('click', e)
      // expect(events.emit).to.have.been.calledWith('external:open', url)
      // expect(e.preventDefault).to.have.been.called
    })
  })
})
