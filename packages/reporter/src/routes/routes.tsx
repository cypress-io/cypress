import cs from 'classnames'
import _ from 'lodash'
import { autorun } from 'mobx'
import { observer } from 'mobx-react'
import React, { useEffect } from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import Collapsible from '../collapsible/collapsible'
import { RouteModel } from './route-model'
import { indentPadding } from '../lib/util'
import { Collection } from '../tree/virtual-collection'

export interface RouteProps {
  model: RouteModel
}

export const Route = observer(({ model }: RouteProps) => (
  <tr className={cs({ 'no-responses': !model.numResponses })}>
    <td>{model.method}</td>
    <td>{model.url}</td>
    <td>{model.isStubbed ? 'Yes' : 'No'}</td>
    <td>
      <Tooltip placement='top' title={`Aliased this route as: '${model.alias}'`} className='cy-tooltip'>
        <span className='route-alias'>{model.alias}</span>
      </Tooltip>
    </td>
    <td className='response-count'>{model.numResponses || '-'}</td>
  </tr>
))

export interface RoutesProps {
  model: Collection<RouteModel>
  style: React.CSSProperties
  measure: Function
}

export const Routes = observer(({ model, style, measure }: RoutesProps) => {
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
      className={cs('runnable-routes-region', `runnable-state-${model.parent.state}`, {
        'no-routes': !model.items.length,
      })}
      style={indentPadding(style, model.level)}
    >
      <div className='instruments-container hooks-container'>
        <Collapsible
          header={`Routes (${model.items.length})`}
          headerClass='hook-header'
          contentClass='instrument-content'
          onToggle={onToggle}
        >
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Url</th>
                <th>Stubbed</th>
                <th>Alias</th>
                <th>
                  <Tooltip placement='top' title='Number of responses which matched this route' className='cy-tooltip'>
                    <span>#</span>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {_.map(model.items, (route: RouteModel) => <Route key={route.id} model={route} />)}
            </tbody>
          </table>
        </Collapsible>
      </div>
    </div>
  )
})
