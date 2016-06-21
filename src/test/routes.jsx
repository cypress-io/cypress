import cs from 'classnames'
import _ from 'lodash'
import React from 'react'
import Tooltip from 'rc-tooltip'
import Collapsible from '../collapsible/collapsible'

const formatUrl = (url) => url

const Route = ({ model }) => (
  <tr className={cs({ 'no-responses': !model.numResponses })}>
    <td>{model.method}</td>
    <td>{formatUrl(model.url)}</td>
    <td>{model.isStubbed ? 'Yes' : 'No'}</td>
    <td>
      <Tooltip placement='top' align={{ offset: [0, 5] }} overlay={`Aliased this route as: '${model.alias}'`}>
        <span className='route-alias'>{model.alias}</span>
      </Tooltip>
    </td>
    <td className='response-count'>{model.numResponses || '-'}</td>
  </tr>
)

const RoutesList = ({ routes }) => (
  <tbody>
    {_.map(routes, (route) => <Route key={route.id} model={route} />)}
  </tbody>
)

const Routes = ({ model }) => (
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
            headerClass='hook-name'
            contentClass='instrument-content'
          >
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Url</th>
                  <th>Stubbed</th>
                  <th>Alias</th>
                  <th>
                    <Tooltip placement='left' align={{ offset: [5, 0] }} overlay='Number of responses which matched this route'><span>#</span></Tooltip>
                  </th>
                </tr>
              </thead>
              <RoutesList routes={model.routes} />
            </table>
          </Collapsible>
        </li>
      </ul>
    </div>
  </div>
)

export default Routes
