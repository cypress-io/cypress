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
    id: _.uniqueId('h'),
    name: 'before',
    failed: false,
    commands: [commandModel(), commandModel()],
  }, props)
}

const model = (props?: Partial<HooksModel>) => {
  return _.extend<HooksModel>({
    hooks: [hookModel(), hookModel(), hookModel()],
  }, props)
}

describe('<Hooks />', () => {
  it('renders a <Hook /> for each hook in model', () => {
    const component = shallow(<Hooks model={model()} />)

    expect(component.find(Hook).length).to.equal(3)
  })

  it('properly displays hook index', () => {
    const component = shallow(<Hooks model={model()} />)

    expect(component.find(Hook).first().prop('showCount')).to.equal(true)
  })

  it('properly hides hook index', () => {
    const component = shallow(<Hooks model={_.extend<HooksModel>({ hooks: [hookModel({ name: 'before each' }), hookModel()] })} />)

    expect(component.find(Hook).first().prop('showCount')).to.equal(false)
  })

  context('<Hook />', () => {
    it('renders without hook-failed class when not failed', () => {
      const component = shallow(<Hook model={hookModel()} showCount={false} />)

      expect(component).not.to.have.className('hook-failed')
    })

    it('renders with hook-failed class when failed', () => {
      const component = shallow(<Hook model={hookModel({ failed: true })} showCount={false} />)

      expect(component).to.have.className('hook-failed')
    })

    it('renders Collapsible with hook header', () => {
      const component = shallow(<Hook model={hookModel()} showCount={false} />)
      const header = shallow(component.find('Collapsible').prop('header'))

      expect(header.find('.hook-failed-message')).to.have.text('(failed)')
    })

    it('renders Collapsible open', () => {
      const component = shallow(<Hook model={hookModel()} showCount={false} />)

      expect(component.find('Collapsible').prop('isOpen')).to.be.true
    })

    it('renders command for each in model', () => {
      const component = shallow(<Hook model={hookModel()} showCount={false} />)

      expect(component.find('Command').length).to.equal(2)
    })
  })

  context('<HookHeader />', () => {
    it('renders the name', () => {
      const component = shallow(<HookHeader name='before' showCount={false} />)

      expect(component.text()).to.contain('before')
    })

    it('renders the name with count', () => {
      const component = shallow(<HookHeader name='before each (1)' showCount={true} />)

      expect(component.text()).to.contain('before each (1)')
    })

    it('renders the name without count', () => {
      const component = shallow(<HookHeader name='before each (1)' showCount={false} />)

      expect(component.text()).to.contain('before each')
      expect(component.text()).not.to.contain('(1)')
    })

    it('renders the failed message', () => {
      const component = shallow(<HookHeader name='before' showCount={false} />)

      expect(component.find('.hook-failed-message')).to.have.text('(failed)')
    })
  })
})
