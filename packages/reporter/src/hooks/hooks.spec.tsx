import { shallow } from 'enzyme'
import _ from 'lodash'
import React from 'react'

import HookModel from './hook-model'
import Hooks, { Hook, HookHeader, HooksModel } from './hooks'

const commandModel = () => {
  return { id: _.uniqueId('c') }
}

const hookModel = (props?: Partial<HookModel>) => {
  return _.extend<HookModel>({
    hookId: _.uniqueId('h'),
    hookName: 'before each',
    failed: false,
    commands: [commandModel(), commandModel()],
  }, props)
}

const model = (props?: Partial<HooksModel>) => {
  return _.extend<HooksModel>({
    hooks: [hookModel(), hookModel(), hookModel()],
    hookCount: {
      'before all': 0,
      'before each': 3,
      'after all': 0,
      'after each': 0,
      'test body': 0,
    },
  }, props)
}

describe('<Hooks />', () => {
  it('renders a <Hook /> for each hook in model', () => {
    const component = shallow(<Hooks model={model()} />)

    expect(component.find(Hook).length).to.equal(3)
  })

  it('renders a number when there are multiple hooks of the same name', () => {
    const component = shallow(<Hooks model={model()} />)

    expect(component.find(Hook).first()).to.have.prop('showNumber', true)
  })

  it('does not render a number when there are not multiple hooks of the same name', () => {
    const component = shallow(<Hooks model={model({
      hooks: [hookModel()],
      hookCount: {
        'before all': 0,
        'before each': 1,
        'after all': 0,
        'after each': 0,
        'test body': 0,
      },
    })} />)

    expect(component.find(Hook).first()).to.have.prop('showNumber', false)
  })

  context('<Hook />', () => {
    it('renders without hook-failed class when not failed', () => {
      const component = shallow(<Hook model={hookModel()} showNumber={false} />)

      expect(component).not.to.have.className('hook-failed')
    })

    it('renders with hook-failed class when failed', () => {
      const component = shallow(<Hook model={hookModel({ failed: true })} showNumber={false} />)

      expect(component).to.have.className('hook-failed')
    })

    it('renders Collapsible with hook header', () => {
      const component = shallow(<Hook model={hookModel()} showNumber={false} />)
      const header = shallow(component.find('Collapsible').prop('header'))

      expect(header.find('.hook-failed-message')).to.have.text('(failed)')
    })

    it('renders Collapsible open', () => {
      const component = shallow(<Hook model={hookModel()} showNumber={false} />)

      expect(component.find('Collapsible').prop('isOpen')).to.be.true
    })

    it('renders command for each in model', () => {
      const component = shallow(<Hook model={hookModel()} showNumber={false} />)

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

    it('renders the number', () => {
      const component = shallow(<HookHeader name='before' number={1} />)

      expect(component.text()).to.contain('before (1)')
    })
  })
})
