import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Collapsible from '../collapsible/collapsible'

import type AgentModel from './agent-model'
import type { Alias } from '../instruments/instrument-model'

interface AgentComponentProps {
  model: AgentModel
}

const Agent = observer(({ model }: AgentComponentProps) => (
  <tr className={cs('agent-item', { 'no-calls': !model.callCount })}>
    <td>{model.name}</td>
    <td>{model.functionName}</td>
    <td>{([] as Array<Alias>).concat(model.alias || []).join(', ')}</td>
    <td className='call-count'>{model.callCount || '-'}</td>
  </tr>
))

interface AgentsModel {
  agents: Array<AgentModel>
}

interface AgentsProps {
  model: AgentsModel
}

const AgentsList: React.FC<AgentsProps> = observer(({ model }: AgentsProps) => (
  <tbody>
    {_.map(model.agents, (agent) => <Agent key={agent.id} model={agent} />)}
  </tbody>
))

AgentsList.displayName = 'AgentsList'

const Agents: React.FC<AgentsProps> = observer(({ model }: AgentsProps) => {
  if (!model.agents.length) {
    return null
  }

  return (
    <div className='runnable-agents-region'>
      <div className='instruments-container'>
        <ul className='hooks-container'>
          <li className='hook-item'>
            <Collapsible
              header={`Spies / Stubs (${model.agents.length})`}
              headerClass='hook-header'
              contentClass='instrument-content'
            >
              <table>
                <thead>
                  <tr>
                    <th>Type</th>{/* the spy/stub's name provided by the driver */}
                    <th>Function</th>
                    <th>Alias(es)</th>
                    <th className='call-count'># Calls</th>
                  </tr>
                </thead>
                <AgentsList model={model} />
              </table>
            </Collapsible>
          </li>
        </ul>
      </div>
    </div>)
})

Agents.displayName = 'Agents'

export default Agents
