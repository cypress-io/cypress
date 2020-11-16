import cs from 'classnames'
import _ from 'lodash'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
import Collapsible from '../collapsible/collapsible'

import { AgentModel } from './agent-model'
import { Alias } from '../instruments/instrument-model'
import { indentPadding } from '../lib/util'
import { Collection } from '../tree/virtual-collection'

export interface AgentProps {
  model: AgentModel
}

export const Agent = observer(({ model }: AgentProps) => (
  <tr className={cs({ 'no-calls': !model.callCount })}>
    <td>{model.type}</td>
    <td>{model.functionName}</td>
    <td>{([] as Array<Alias>).concat(model.alias || []).join(', ')}</td>
    <td className='call-count'>{model.callCount || '-'}</td>
  </tr>
))

export interface AgentsProps {
  model: Collection<AgentModel>
  style: React.CSSProperties
  measure: Function
}

export const Agents = observer(({ model, style, measure }: AgentsProps) => {
  // TODO: abstract this or find a better pattern so this isn't necessary for every component
  useEffect(() => {
    const disposeAutorun = autorun(() => {
      model.items.length

      requestAnimationFrame(() => {
        measure()
      })
    })

    return () => {
      disposeAutorun()
    }
  }, [true])

  const onToggle = () => {
    requestAnimationFrame(() => {
      measure()
    })
  }

  return (
    <div
      className={cs('runnable-agents-region', `runnable-state-${model.parent.state}`, {
        'no-agents': !model.items.length,
      })}
      style={indentPadding(style, model.level)}
    >
      <div className='instruments-container hooks-container'>
        <Collapsible
          header={`Spies / Stubs (${model.items.length})`}
          headerClass='hook-header'
          contentClass='instrument-content'
          onToggle={onToggle}
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
            <tbody>
              {_.map(model.items, (agent: AgentModel) => <Agent key={agent.id} model={agent} />)}
            </tbody>
          </table>
        </Collapsible>
      </div>
    </div>
  )
})
