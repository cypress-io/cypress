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
              <p className="text-muted node-version-text"><strong>Note:</strong> This version of Node.js was detected on your <code>system</code>.</p>
            </div> :
            <div>
              <span><strong>Note:</strong> This version of Node.js is bundled with Cypress.</span>
              To use
              {
                usesSystemNodeVersion ?
                  ' the Node.js version bundled with Cypress' :
                  ' your system Node.js version'
              }, set <a href="#" onClick={openHelp}><code>nodeVersion</code></a> to <code>{usesSystemNodeVersion ? 'bundled' : 'system'}</code> in your configuration.
            </div>
        }{' '}

        {/* This project is using{' '}
        <strong>Node v{resolvedNodeVersion}</strong>
        {
          usesSystemNodeVersion ?
            <span> at <code> {resolvedNodePath}</code>, which is your <code>system</code> Node version. </span> :
            <span>, which is the <code>bundled</code> Node version with Cypress.</span>
        }
        {' '} */}
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
