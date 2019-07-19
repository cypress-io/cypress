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

  function formatPluginsFile () {
    const pluginsFile = _.get(resolvedConfig, 'pluginsFile.value')

    if (pluginsFile) {
      return <span>, <code>{pluginsFile}</code></span>
    }
  }

  return (
    <div className="node-version">
      {renderLearnMore()}
      <p className="text-muted">
        The Node.js version is used to execute code in your plugins file{formatPluginsFile()}.
      </p>
      <table className="node-table">
        <tbody>
          <tr>
            <th>
              Node Version:
            </th>
            <td className="version">
              v{resolvedNodeVersion} {!resolvedNodePath && <span className='text-muted'>(bundled with Cypress)</span>}
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
