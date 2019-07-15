import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/configuration#Node-Version')
}

const renderLearnMore = () => {
  return (
    <a href='#' className='learn-more' onClick={openHelp}>
      <i className='fa fa-info-circle'></i> Learn more
    </a>
  )
}

const NodeVersion = observer(({ project }) => {
  const { resolvedConfig, resolvedNodeVersion, resolvedNodePath } = project

  return (
    <div className="node-version">
      {renderLearnMore()}
      <p>This Node version will be used to execute your plugins file (<code>{_.get(resolvedConfig, 'pluginsFile.value')}</code>):</p>
      <table className="node-table">
        <tbody>
          <tr>
            <th>
              Node Version:
            </th>
            <td className="version">
              v{resolvedNodeVersion} {!resolvedNodePath && '(bundled with Cypress)'}
            </td>
          </tr>
          {resolvedNodePath && <tr>
            <th>Node Path:</th>
            <td className="path">
              <code>{resolvedNodePath}</code>
            </td>
          </tr>}
        </tbody>
      </table>
    </div>
  )
})

export default NodeVersion
