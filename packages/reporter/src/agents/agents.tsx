import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Collapsible from '../collapsible/collapsible'

import { AgentModel } from './agent-model'
import { Alias } from '../instruments/instrument-model'
import { indentPadding } from '../lib/util'
import { Collection } from '../virtual-tree/virtual-collection'
import { VirtualizableProps } from '../virtual-tree/virtualizable-types'
import { measureOnChange } from '../virtual-tree/virtualizable-util'

export interface AgentProps {
  model: AgentModel
}

export const Agent = observer(({ model }: AgentProps) => (
  <tr className={cs('agent-item', { 'no-calls': !model.callCount })}>
    <td>{model.type}</td>
    <td>{model.functionName}</td>
    <td>{([] as Array<Alias>).concat(model.alias || []).join(', ')}</td>
    <td className='call-count'>{model.callCount || '-'}</td>
  </tr>
))

export interface AgentsProps {
  model: Collection<AgentModel>
  virtualizableProps: VirtualizableProps
}

export const Agents = observer(({ model, virtualizableProps }: AgentsProps) => {
  measureOnChange(virtualizableProps, () => {
    // list any observable properties that may affect the height or width
    // of the rendered DOM, in order to tell react-virtualized-tree
    // to re-measure when they change
    model.items.length
  })

  return (
    <div
      className={cs('runnable-agents-region', `runnable-state-${model.parent.state}`, {
        'no-agents': !model.items.length,
      })}
      style={indentPadding(virtualizableProps.style, model.level)}
    >
      <div className='instruments-container hooks-container'>
        <Collapsible
          header={`Spies / Stubs (${model.items.length})`}
          headerClass='hook-header'
          contentClass='instrument-content'
          onToggle={virtualizableProps.measure}
        >
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Function</th>
                <th>Alias(es)</th>
                <th className='call-count'># Calls</th>
              </tr>
            </thead>
            <tbody>
              {_.map(model.items, (agent: AgentModel) => <Agent key={agent.id} model={agent} />)}
            </tbody>
          </table>
        </Collapsible>
      </div>
    </div>
  )
})
