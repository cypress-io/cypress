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

    return null
  }

  function formatSupportFile () {
    const supportFile = _.get(resolvedConfig, 'supportFile.value')

    if (supportFile) {
      return <code>{supportFile}</code>
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
      <p>
        <strong>Node Version v{resolvedNodeVersion}</strong> {!resolvedNodePath && <span className='text-muted'>(bundled with Cypress)</span>} {resolvedNodePath ? <span> at <code>{resolvedNodePath}</code></span> : ''} is used to:
        <ul>
          <li>Build files in the {formatIntegrationFolder()} folder.</li>
          <li>Build files in the {formatSupportFile() ? formatSupportFile() : 'support'} folder.</li>
          <li>Execute code in the {formatPluginsFile() ? formatPluginsFile() : 'plugins'} file.</li>
        </ul>
        To access features or modules only available in your system Node version, set <code>"nodeVersion": "system"</code> in your configuration. Otherwise, everything will use the bundled Node version that comes with Cypress.
      </p>
    </div>
  )
})

export default NodeVersion
