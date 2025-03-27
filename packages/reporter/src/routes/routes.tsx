import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import Collapsible from '../collapsible/collapsible'
import Tag from '../lib/tag'
import type RouteModel from './route-model'

export interface RouteProps {
  model: RouteModel
}

const Route = observer(({ model }: RouteProps) => (
  <tr className={cs('route-item', { 'no-responses': !model.numResponses })}>
    <td className='route-method'>{model.method}</td>
    <td className='route-url'>{model.url}</td>
    <td className='route-is-stubbed'>{model.isStubbed ? 'Yes' : 'No'}</td>
    <td className='route-alias'>
      <Tag
        tooltipMessage={`Aliased this route as: '${model.alias}'`}
        type='route'
        customClassName='route-alias-name'
        content={model.alias}
      />
    </td>
    <td className='route-num-responses'>{model.numResponses || '-'}</td>
  </tr>
))

export interface RouteListModel {
  routes: Array<RouteModel>
}

export interface RouteListProps {
  model: RouteListModel
}

const RoutesList = observer(({ model }: RouteListProps) => (
  <tbody>
    {_.map(model.routes, (route) => <Route key={route.id} model={route} />)}
  </tbody>
))

export interface RoutesProps {
  model: RouteListModel
}

const Routes = observer(({ model }: RoutesProps) => {
  if (!model.routes.length) {
    return null
  }

  return (
    <div
      className={cs('runnable-routes-region', {
        'no-routes': !model.routes.length,
      })}
    >
      <div className='instruments-container'>
        <ul className='hooks-container'>
          <li className='hook-item'>
            <Collapsible
              header={`Routes (${model.routes.length})`}
              headerClass='hook-header'
              contentClass='instrument-content'
            >
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Route Matcher</th>
                    <th>Stubbed</th>
                    <th>Alias</th>
                    <th>
                      <Tooltip placement='top' title='Number of responses which matched this route' className='cy-tooltip'>
                        <span>#</span>
                      </Tooltip>
                    </th>
                  </tr>
                </thead>
                <RoutesList model={model} />
              </table>
            </Collapsible>
          </li>
        </ul>
      </div>
    </div>
  )
})

export { Route, RoutesList }

export default Routes
