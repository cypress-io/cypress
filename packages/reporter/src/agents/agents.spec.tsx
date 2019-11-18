import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'

import Agents, { Agent, AgentsList, AgentsModel } from './agents'
import AgentModel from './agent-model'

const agentModel = (props?: Partial<AgentModel>) => {
  return _.extend<AgentModel>({
    id: _.uniqueId('a'),
    name: 'agent',
    callCount: 0,
    type: 'spy',
    functionName: 'foo',
  }, props)
}

const model = (props?: AgentsModel) => {
  return _.extend({
    agents: [agentModel(), agentModel()],
  }, props)
}

describe('<Agents />', () => {
  it('renders without no-agents class if there are agents', () => {
    const component = shallow(<Agents model={model()} />)

    expect(component).not.to.have.className('no-agents')
  })

  it('renders with no-agents class if there are no agents', () => {
    const component = shallow(<Agents model={model({ agents: [] })} />)

    expect(component).to.have.className('no-agents')
  })

  it('renders collapsible header with number of agents', () => {
    const component = shallow(<Agents model={model()} />)

    expect(component.find('Collapsible')).to.have.prop('header', 'Spies / Stubs (2)')
  })

  context('<AgentsList />', () => {
    it('is rendered', () => {
      const component = shallow(<Agents model={model()} />)

      expect(component.find(AgentsList).first()).to.exist
    })

    it('renders an <Agent /> for each agent in model', () => {
      const component = shallow(<AgentsList model={model()} />)

      expect(component.find(Agent).length).to.equal(2)
    })
  })

  context('<Agent />', () => {
    it('renders without no-calls class if there is a non-zero callCount', () => {
      const component = shallow(<Agent model={agentModel({ callCount: 1 })} />)

      expect(component).not.to.have.className('no-calls')
    })

    it('renders with no-calls class if zero callCount', () => {
      const component = shallow(<Agent model={agentModel()} />)

      expect(component).to.have.className('no-calls')
    })

    it('renders the type', () => {
      const component = shallow(<Agent model={agentModel()} />)

      expect(component.find('td').first()).to.have.text('spy')
    })

    it('renders the function name', () => {
      const component = shallow(<Agent model={agentModel()} />)

      expect(component.find('td').at(1)).to.have.text('foo')
    })

    it('renders the callCount if non-zero', () => {
      const component = shallow(<Agent model={agentModel({ callCount: 1 })} />)

      expect(component.find('.call-count')).to.have.text('1')
    })

    it('renders the callCount as "-" if zero', () => {
      const component = shallow(<Agent model={agentModel()} />)

      expect(component.find('.call-count')).to.have.text('-')
    })

    it('renders alias when singular', () => {
      const component = shallow(<Agent model={agentModel({ alias: 'foo' })} />)

      expect(component.find('td').at(2)).to.have.text('foo')
    })

    it('renders aliases when multiple', () => {
      const component = shallow(<Agent model={agentModel({ alias: ['foo', 'bar'] })} />)

      expect(component.find('td').at(2)).to.have.text('foo, bar')
    })
  })
})
