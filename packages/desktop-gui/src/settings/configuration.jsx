import _ from 'lodash'
import { defaultTo, get, flow, join, map, reduce, take, toPairs, toPath } from 'lodash/fp'
import cn from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'
import { ObjectInspector, ObjectName } from 'react-inspector'
import { configFileFormatted } from '../lib/config-file-formatted'
import ipc from '../lib/ipc'

const joinWithCommas = join(', ')
const objToString = (v) => flow([
  defaultTo(v.name),
  defaultTo(_.isObject(v) ? joinWithCommas(Object.keys(v)) : undefined),
  defaultTo(String(v)),
])(v.displayName)

const formatValue = (value) => {
  if (Array.isArray(value)) {
    return flow([
      map(objToString),
      joinWithCommas,
    ])(value)
  }

  if (_.isObject(value)) {
    return objToString(value)
  }

  const excludedFromQuotations = ['null', 'undefined']

  if (_.isString(value) && !excludedFromQuotations.includes(value)) {
    return `"${value}"`
  }

  return String(value)
}

const normalizeWithoutMeta = flow([
  toPairs,
  reduce((acc, [key, value]) => _.merge({}, acc, {
    [key]: value.value,
  }), {}),
])

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
  const getValueForPath = flow([
    toPath,
    _.partialRight(get, obj),
  ])

  let value = getValueForPath(normalizedPath)

  if (!value) {
    const onlyFirstKeyInPath = flow([toPath, take(1)])

    value = getValueForPath(onlyFirstKeyInPath(normalizedPath))
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
          <td><span className='plugins'>plugin</span></td>
          <td>set from plugin file</td>
        </tr>
      </tbody>
    </table>
    <ConfigDisplay data={project.resolvedConfig} />
  </div>
))

export default Configuration
