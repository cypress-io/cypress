import { observer } from 'mobx-react'
import { trim } from 'lodash'
import React from 'react'

const trimQuotes = (input) =>
  trim(input, '"')

const ProxySettings = observer(({ app }) => {
  if (!app.proxySource) {
    return (
      <div>
        <p className='text-muted'>
          There is no active proxy configuration.
        </p>
      </div>
    )
  }

  const bypassProxyList = trimQuotes(app.proxyBypassList)

  return (
    <div className="proxy-settings">
      <p>Cypress auto-detected the following proxy settings from {trimQuotes(app.proxySource)}:</p>
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
              {bypassProxyList ? <code>{bypassProxyList.split(';').join(', ')}</code> : <span className='no-bypass'>none</span>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

export default ProxySettings
