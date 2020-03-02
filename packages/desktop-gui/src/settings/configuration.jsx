import _ from 'lodash'
import cn from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'
import { ObjectInspector, ObjectName } from 'react-inspector'
import { configFileFormatted } from '../lib/config-file-formatted'
import ipc from '../lib/ipc'

const valueToString = (value) => {
  return (
    value.displayName ||
    value.name ||
    (_.isObject(value) && _.keys(value).join(', ')) ||
    String(value)
  )
}

const formatValue = (value) => {
  if (Array.isArray(value)) {
    return _.map(value, valueToString).join(', ')
  }

  if (_.isObject(value)) {
    return valueToString(value)
  }

  const excludedFromQuotations = ['null', 'undefined']

  if (_.isString(value) && !excludedFromQuotations.includes(value)) {
    return `"${value}"`
  }

  return String(value)
}

const normalizeWithoutMeta = (value = {}) => {
  const pairs = _.toPairs(value)
  const values = _.reduce(pairs, (acc, [key, value]) => _.merge({}, acc, {
    [key]: value ? value.value : {},
  }), {})

  if (_.isEmpty(values)) {
    return null
  }

  return values
}

const ObjectLabel = ({ name, data, expanded, from, isNonenumerable }) => {
  const formattedData = formatValue(data)

  return (
    <span className="line" key={name}>
      <ObjectName name={name} dimmed={isNonenumerable} />
      <span>:</span>
      {!expanded && (
        <>
          {from && (
            <Tooltip title={from} placement='right' className='cy-tooltip'>
              <span className={cn(from, 'key-value-pair-value')}>
                <span>{formattedData}</span>
              </span>
            </Tooltip>
          )}
          {!from && (
            <span className={cn(from, 'key-value-pair-value')}>
              <span>{formattedData}</span>
            </span>
          )}
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

const computeFromValue = (obj, name, path) => {
  const normalizedPath = path.replace('$.', '').replace(name, `['${name}']`)
  let value = _.get(obj, normalizedPath)

  if (!value) {
    const firstKeyInPath = _.toPath(normalizedPath)[0]

    value = _.get(obj, firstKeyInPath)
  }

  if (!value) {
    return undefined
  }

  return value.from ? value.from : undefined
}

const ConfigDisplay = ({ data: obj }) => {
  const getFromValue = _.partial(computeFromValue, obj)
  const renderNode = ({ depth, name, data, isNonenumerable, expanded, path }) => {
    if (depth === 0) {
      return null
    }

    const from = getFromValue(name, path)

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

  const data = normalizeWithoutMeta(obj)

  data.env = normalizeWithoutMeta(obj.env)

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
      <i className='fas fa-info-circle'></i> Learn more
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
          <td><span className='plugin'>plugin</span></td>
          <td>set from plugin file</td>
        </tr>
      </tbody>
    </table>
    <ConfigDisplay data={project.resolvedConfig} />
  </div>
))

export default Configuration
