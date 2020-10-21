import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
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
  const onToggle = () => {
    requestAnimationFrame(() => {
      measure()
    })
  }

  return (
    <div
      className={cs('runnable-routes-region', {
        'no-routes': !model.items.length,
      })}
      style={indentPadding(style, model.level)}
    >
      <div className='instruments-container'>
        <ul className='hooks-container'>
          <li className='hook-item'>
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
          </li>
        </ul>
      </div>
    </div>
  )
})
