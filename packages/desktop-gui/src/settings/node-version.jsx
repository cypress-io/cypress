import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import ipc from '../lib/ipc'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/node-version')
}

const renderLearnMore = () => {
  return (
    <a href='#' className='learn-more' onClick={openHelp}>
      <i className='fas fa-info-circle'></i> Learn more
    </a>
  )
}

const NodeVersion = observer(({ project }) => {
  const { resolvedConfig, resolvedNodeVersion, resolvedNodePath } = project

  const usesSystemNodeVersion = !!resolvedNodePath

  function formatPluginsFile () {
    const pluginsFile = _.get(resolvedConfig, 'pluginsFile.value')

    if (pluginsFile) {
      return <span><code>{pluginsFile}</code></span>
    }

    return null
  }

  function formatIntegrationFolder () {
    const integrationFolder = _.get(resolvedConfig, 'integrationFolder.value')

    return <code>{integrationFolder}</code>
  }

  return (
    <div className="node-version">
      {renderLearnMore()}
      <div>
        {
          usesSystemNodeVersion ?
            <div>
              <table className="node-table">
                <tbody>
                  <tr>
                    <th>System Version</th>
                    <td>
                      <code>
                        {resolvedNodeVersion}
                      </code>
                    </td>
                  </tr>
                  <tr>
                    <th>
                      Node.js Path
                    </th>
                    <td>
                      <code>{resolvedNodePath}</code>
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="text-muted node-version-text">
                <strong>Note:</strong> This version of Node.js was detected on your{' '}
                <a href="#" onClick={openHelp}>
                  <code>system</code>
                </a>.
              </p>
            </div> :
            <div>
              <span><strong>Note:</strong> This version of Node.js is bundled with Cypress. </span>
              To use your system Node.js version, set{' '}
              <a href="#" onClick={openHelp}>
                <code>nodeVersion</code>
              </a> to <code>system</code> in your configuration.
            </div>
        }{' '}
        <div className='well text-muted'>
          This Node.js version is used to:
          <ul>
            <li>Build files in the {formatIntegrationFolder()} folder.</li>
            <li>Build files in the <code>cypress/support</code> folder.</li>
            <li>Execute code in the {formatPluginsFile() ? formatPluginsFile() : 'plugins'} file.</li>
          </ul>
        </div>
      </div>
    </div>
  )
})

export default NodeVersion
