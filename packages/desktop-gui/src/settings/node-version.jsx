import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

const NodeVersion = observer(({ project }) => {
  const { resolvedConfig, resolvedNodeVersion, resolvedNodePath } = project

  return (
    <div className="node-version">
      <p>This Node version will be used to execute your plugins file (<code>{_.get(resolvedConfig, 'pluginsFile.value')}</code>):</p>
      <table className="node-table">
        <tbody>
          <tr>
            <th>
              Node Version:
            </th>
            <td className="version">
              {resolvedNodeVersion ? `v${resolvedNodeVersion}` : 'Unable to detect'}
            </td>
          </tr>
          <tr>
            <th>Node Path:</th>
            <td className="path">
              {resolvedNodePath ? <code>{resolvedNodePath}</code> : 'N/A (bundled with Cypress)'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
})

export default NodeVersion
