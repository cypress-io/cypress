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
        This project is using{' '}
        <strong>Node v{resolvedNodeVersion}</strong>
        {
          usesSystemNodeVersion ?
            <span> at <code> {resolvedNodePath}</code>, which is your system Node version. </span> :
            ', which comes bundled with Cypress.'
        }
        {' '}This Node version is used to:
        <ul>
          <li>Build files in the {formatIntegrationFolder()} folder.</li>
          <li>Build files in the <code>cypress/support</code> folder.</li>
          <li>Execute code in the {formatPluginsFile() ? formatPluginsFile() : 'plugins'} file.</li>
        </ul>
        To change this project to use
        {
          usesSystemNodeVersion ?
            ' the Node version bundled with Cypress' :
            ' your system Node version'
        }, set <code>nodeVersion</code> to <code>{usesSystemNodeVersion ? 'bundled' : 'system'}</code> in your configuration.
      </div>
    </div>
  )
})

export default NodeVersion
