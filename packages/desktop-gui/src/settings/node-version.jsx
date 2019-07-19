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
      return <code>{pluginsFile}</code>
    }

    return 'currently disabled'
  }

  return (
    <div className="node-version">
      {renderLearnMore()}
      <p className="text-muted">
        Used to build files found in the <code>cypress</code> folder and execute code in the plugins in {formatPluginsFile()}. To access features or modules only available in your system Node version, set <code>"nodeVersion": "system"</code> in your configuration. Otherwise, everything will use the bundled Node version that comes with Cypress.
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
