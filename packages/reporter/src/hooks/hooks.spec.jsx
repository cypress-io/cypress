import { shallow } from 'enzyme'
import _ from 'lodash'
import React from 'react'

import Hooks, { Hook, HookHeader } from './hooks'

const commandModel = () => {
  return { id: _.uniqueId('c') }
}

const hookModel = (props) => {
  return _.extend({
    id: _.uniqueId('h'),
    name: 'before',
    failed: false,
    commands: [commandModel(), commandModel()],
  }, props)
}

const model = (props) => {
  return _.extend({
    hooks: [hookModel(), hookModel(), hookModel()],
  }, props)
}

describe('<Hooks />', () => {
  it('renders a <Hook /> for each hook in model', () => {
    const component = shallow(<Hooks model={model()} />)

    expect(component.find(Hook).length).to.equal(3)
  })

  context('<Hook />', () => {
    it('renders without hook-failed class when not failed', () => {
      const component = shallow(<Hook model={hookModel()} />)

      expect(component).not.to.have.className('hook-failed')
    })

    it('renders with hook-failed class when failed', () => {
      const component = shallow(<Hook model={hookModel({ failed: true })} />)

      expect(component).to.have.className('hook-failed')
    })

    it('renders Collapsible with hook header', () => {
      const component = shallow(<Hook model={hookModel()} />)
      const header = shallow(component.find('Collapsible').prop('header'))

      expect(header.find('.hook-failed-message')).to.have.text('(failed)')
    })

    it('renders Collapsible open', () => {
      const component = shallow(<Hook model={hookModel()} />)

      expect(component.find('Collapsible').prop('isOpen')).to.be.true
    })

    it('renders command for each in model', () => {
      const component = shallow(<Hook model={hookModel()} />)

      expect(component.find('Command').length).to.equal(2)
    })
  })

  context('<HookHeader />', () => {
    it('renders the name', () => {
      const component = shallow(<HookHeader name='before' />)

      expect(component.text()).to.contain('before')
    })

    it('renders the failed message', () => {
      const component = shallow(<HookHeader name='before' />)

      expect(component.find('.hook-failed-message')).to.have.text('(failed)')
    })
  })
})
