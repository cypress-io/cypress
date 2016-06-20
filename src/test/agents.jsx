import cs from 'classnames'
import _ from 'lodash'
import React from 'react'

const Agent = ({ model }) => (
  <tr className={model.callCount ? '' : 'no-calls'}>
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
          <span className='hook-name'>
            <i className='fa fa-caret-right'></i>
            Spies / Stubs / Mocks ({model.agents.length})
            <i className='fa fa-ellipsis-h'></i>
          </span>
          <div className='agents-container' data-comment='hidden className goes here'>
            <div className='tab-content'>
              <div className='tab-pane active'>
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
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
)

export default Agents
