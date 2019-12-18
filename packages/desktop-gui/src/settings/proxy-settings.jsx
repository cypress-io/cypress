import { observer } from 'mobx-react'
import Tooltip from '@cypress/react-tooltip'
import { trim } from 'lodash'
import React from 'react'

import ipc from '../lib/ipc'

const trimQuotes = (input) =>
  trim(input, '"')

const getProxySourceName = (proxySource) => {
  if (proxySource === 'win32') {
    return 'Windows system settings'
  }

  return 'environment variables'
}

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/proxy-configuration')
}

const renderLearnMore = () => {
  return (
    <a href='#' className='learn-more' onClick={openHelp}>
      <i className='fas fa-info-circle'></i> Learn more
    </a>
  )
}

const ProxySettings = observer(({ app }) => {
  if (!app.proxyServer) {
    return (
      <div>
        {renderLearnMore()}
        <p className='text-muted'>
          There is no active proxy configuration.
        </p>
      </div>
    )
  }

  const proxyBypassList = trimQuotes(app.proxyBypassList)
  const proxySource = getProxySourceName(trimQuotes(app.proxySource))

  return (
    <div className="proxy-settings">
      {renderLearnMore()}
      <p>Cypress auto-detected the following proxy settings from {proxySource}:</p>
      <table className="proxy-table">
        <tbody>
          <tr>
            <th>Proxy Server</th>
            <td>
              <code>
                {trimQuotes(app.proxyServer)}
              </code>
            </td>
          </tr>
          <tr>
            <th>
              Proxy Bypass List{' '}
              <Tooltip className='cy-tooltip'
                title='Cypress will not route requests to these domains through the configured proxy server.'
              >
                <i className='fas fa-info-circle' />
              </Tooltip>
            </th>
            <td>
              {proxyBypassList ? <code>{proxyBypassList.split(',').join(', ')}</code> : <span className='no-bypass'>none</span>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

export default ProxySettings
