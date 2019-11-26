import _ from 'lodash'
import cn from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'
import { ObjectInspector, ObjectName } from 'react-inspector'

import { configFileFormatted } from '../lib/config-file-formatted'
import ipc from '../lib/ipc'

const formatData = (data) => {
  if (Array.isArray(data)) {
    return _.map(data, (v) => {
      if (_.isObject(v) && (v.name || v.displayName)) {
        return _.defaultTo(v.displayName, v.name)
      }

      return String(v)
    }).join(', ')
  }

  if (_.isObject(data)) {
    return _.defaultTo(_.defaultTo(data.displayName, data.name), String(Object.keys(data).join(', ')))
  }

  const excludedFromQuotations = ['null', 'undefined']

  if (_.isString(data) && !excludedFromQuotations.includes(data)) {
    return `"${data}"`
  }

  return String(data)
}
const ObjectLabel = ({ name, data, expanded, from, isNonenumerable }) => {
  const formattedData = formatData(data)

  return (
    <span className="line" key={name}>
      <ObjectName name={name} dimmed={isNonenumerable} />
      <span>:</span>
      {!expanded && (
        <>
          <Tooltip title={from} placement='right' className='cy-tooltip'>
            <span className={cn(from, 'key-value-pair-value')}>
              <span>{formattedData}</span>
            </span>
          </Tooltip>
        </>
      )}
      {expanded && Array.isArray(data) && (
        <span> Array ({data.length})</span>
      )}
    </span>
  )
}

ObjectLabel.defaultProps = {
  data: 'undefined',
}

const createComputeFromValue = (obj) => {
  return (name, path) => {
    const pathParts = path.split('.')
    const pathDepth = pathParts.length

    const rootKey = pathDepth <= 2 ? name : pathParts[1]

    return obj[rootKey] ? obj[rootKey].from : undefined
  }
}

const ConfigDisplay = ({ data: obj }) => {
  const computeFromValue = createComputeFromValue(obj)
  const renderNode = ({ depth, name, data, isNonenumerable, expanded, path }) => {
    if (depth === 0) {
      return null
    }

    const from = computeFromValue(name, path)

    return (
      <ObjectLabel
        name={name}
        data={data}
        expanded={expanded}
        from={from}
        isNonenumerable={isNonenumerable}
      />
    )
  }

  const data = _.reduce(obj, (acc, value, key) => Object.assign(acc, {
    [key]: value.value,
  }), {})

  return (
    <div className="config-vars">
      <span>{'{'}</span>
      <ObjectInspector data={data} expandLevel={1} nodeRenderer={renderNode} />
      <span>{'}'}</span>
    </div>
  )
}

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/guides/configuration')
}

const Configuration = observer(({ project }) => (
  <div>
    <a href='#' className='learn-more' onClick={openHelp}>
      <i className='fa fa-info-circle'></i> Learn more
    </a>
    <p className='text-muted'>Your project's configuration is displayed below. A value can be set from the following sources:</p>
    <table className='table config-table'>
      <tbody>
        <tr className='config-keys'>
          <td><span className='default'>default</span></td>
          <td>default values</td>
        </tr>
        <tr className='config-keys'>
          <td><span className='config'>config</span></td>
          <td>set from {configFileFormatted(project.configFile)}</td>
        </tr>
        <tr className='config-keys'>
          <td><span className='envFile'>envFile</span></td>
          <td>set from <code>cypress.env.json</code></td>
        </tr>
        <tr className='config-keys'>
          <td><span className='env'>env</span></td>
          <td>set from environment variables</td>
        </tr>
        <tr className='config-keys'>
          <td><span className='cli'>CLI</span></td>
          <td>set from CLI arguments</td>
        </tr>
        <tr className='config-keys'>
          <td><span className='plugins'>plugin</span></td>
          <td>set from plugin file</td>
        </tr>
      </tbody>
    </table>
    <ConfigDisplay data={project.resolvedConfig} />
  </div>
))

export default Configuration
