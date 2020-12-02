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
import { VirtualizableProps } from '../tree/virtualizable-types'

export interface RouteProps {
  model: RouteModel
}

export const Route = observer(({ model }: RouteProps) => (
  <tr className={cs('route-item', { 'no-responses': !model.numResponses })}>
    <td className='route-method'>{model.method}</td>
    <td className='route-url'>{model.url}</td>
    <td className='route-is-stubbed'>{model.isStubbed ? 'Yes' : 'No'}</td>
    <td className='route-alias'>
      <Tooltip placement='top' title={`Aliased this route as: '${model.alias}'`} className='cy-tooltip'>
        <span className='route-alias-name'>{model.alias}</span>
      </Tooltip>
    </td>
    <td className='route-num-responses'>{model.numResponses || '-'}</td>
  </tr>
))

export interface RoutesProps {
  model: Collection<RouteModel>
  virtualizableProps: VirtualizableProps
}

export const Routes = observer(({ model, virtualizableProps }: RoutesProps) => {
  useEffect(() => {
    const disposeAutorun = autorun(() => {
      model.items.length

      virtualizableProps.measure()
    })

    return () => {
      disposeAutorun()
    }
  }, [true])

  return (
    <div
      className={cs('runnable-routes-region', `runnable-state-${model.parent.state}`, {
        'no-routes': !model.items.length,
      })}
      style={indentPadding(virtualizableProps.style, model.level)}
    >
      <div className='instruments-container hooks-container'>
        <Collapsible
          header={`Routes (${model.items.length})`}
          headerClass='hook-header'
          contentClass='instrument-content'
          onToggle={virtualizableProps.measure}
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
