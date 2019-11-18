import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Collapsible from '../collapsible/collapsible'

import AgentModel from './agent-model'
import { Alias } from '../instruments/instrument-model'

export interface AgentProps {
  model: AgentModel
}

const Agent = observer(({ model }: AgentProps) => (
  <tr className={cs({ 'no-calls': !model.callCount })}>
    <td>{model.type}</td>
    <td>{model.functionName}</td>
    <td>{([] as Array<Alias>).concat(model.alias || []).join(', ')}</td>
    <td className='call-count'>{model.callCount || '-'}</td>
  </tr>
))

export interface AgentsModel {
  agents: Array<AgentModel>
}

export interface AgentsProps {
  model: AgentsModel
}

const AgentsList = observer(({ model }: AgentsProps) => (
  <tbody>
    {_.map(model.agents, (agent) => <Agent key={agent.id} model={agent} />)}
  </tbody>
))

const Agents = observer(({ model }: AgentsProps) => (
  <div
    className={cs('runnable-agents-region', {
      'no-agents': !model.agents.length,
    })}
  >
    <div className='instruments-container'>
      <ul className='hooks-container'>
        <li className='hook-item'>
          <Collapsible
            header={`Spies / Stubs (${model.agents.length})`}
            headerClass='hook-name'
            contentClass='instrument-content'
          >
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Function</th>
                  <th>Alias(es)</th>
                  <th># Calls</th>
                </tr>
              </thead>
              <AgentsList model={model} />
            </table>
          </Collapsible>
        </li>
      </ul>
    </div>
  </div>
))

export { Agent, AgentsList }

export default Agents
