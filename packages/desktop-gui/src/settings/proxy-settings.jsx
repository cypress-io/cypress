import { observer } from 'mobx-react'
import { trim } from 'lodash'
import React from 'react'

const trimQuotes = (input) =>
  trim(input, '"')

const getProxySourceName = (proxySource) => {
  if (proxySource === 'win32') {
    return 'Windows system settings'
  }

  return 'environment variables'
}

const ProxySettings = observer(({ app }) => {
  if (!app.proxyServer) {
    return (
      <div>
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
      <p>Cypress auto-detected the following proxy settings from {proxySource}:</p>
      <table className="proxy-table">
        <tbody>
          <tr>
            <td>Proxy server: </td>
            <td>
              <code>
                {trimQuotes(app.proxyServer)}
              </code>
            </td>
          </tr>
          <tr>
            <td>Proxy exceptions: </td>
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
