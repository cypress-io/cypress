import cs from 'classnames'
import _ from 'lodash'
import React from 'react'
import Collapsible from '../collapsible/collapsible'

const Agent = ({ model }) => (
  <tr className={cs({ 'no-calls': !model.callCount })}>
    <td>{model.type}</td>
    <td>{model.functionName}</td>
    <td className='call-count'>{model.callCount || '-'}</td>
  </tr>
)

const AgentsList = ({ model }) => (
  <tbody>
    {_.map(model.agents, (agent) => <Agent key={agent.id} model={agent} />)}
  </tbody>
)

const Agents = ({ model }) => (
  <div
    className={cs('runnable-agents-region', {
      'no-agents': !model.agents.length,
    })}
  >
    <div className='instruments-container'>
      <ul className='hooks-container'>
        <li className='hook-item'>
          <Collapsible
            header={`Spies / Stubs / Mocks (${model.agents.length})`}
            headerClass='hook-name'
            contentClass='instrument-content'
          >
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Function</th>
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
)

export default Agents
