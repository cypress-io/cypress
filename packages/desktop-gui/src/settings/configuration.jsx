import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

import { configFileFormatted } from '../lib/config-file-formatted'
import ipc from '../lib/ipc'

import schema from '../../../../cli/schema/cypress.schema.json'

const schemaDesc = _.mapValues(schema.properties, (o) => {
  return o.description
})

const schemaDefault = _.mapValues(schema.properties, (o) => {
  return o.default || null
})

const display = (obj, schemaDesc, schemaDefault) => {

  const keys = _.keys(obj)
  const lastKey = _.last(keys)

  return _.map(obj, (value, key) => {
    const hasComma = lastKey !== key

    if (value.from == null) {
      return displayNestedObj(key, value, hasComma)
    }

    if (value.isArray) {
      return getSpan(key, value, hasComma, true, schemaDesc, schemaDefault)
    }

    if (_.isObject(value.value)) {
      const realValue = value.value.toJS ? value.value.toJS() : value.value

      if (_.isArray(realValue)) {
        return displayArray(key, value, hasComma)
      }

      return displayObject(key, value, hasComma)
    }

    return getSpan(key, value, hasComma, false, schemaDesc, schemaDefault)
  })
}

const displayNestedObj = (key, value, hasComma) => (
  <span key={key}>
    <span className='nested nested-obj'>
      <span className='key'>{key}</span>
      <span className='colon'>:</span>{' '}
      {'{'}
      {display(value)}
    </span>
    <span className='line'>{'}'}{getComma(hasComma)}</span>
    <br />
  </span>
)

const displayNestedArr = (key, value, hasComma) => (
  <span key={key}>
    <span className='nested nested-arr'>
      <span className='key'>{key}</span>
      <span className='colon'>:</span>{' '}
      {'['}
      {display(value)}
    </span>
    <span className='line'>{']'}{getComma(hasComma)}</span>
    <br />
  </span>
)

const displayArray = (key, nestedArr, hasComma) => {
  const arr = _.map(nestedArr.value, (value) => {
    return { value, from: nestedArr.from, isArray: true }
  })

  return displayNestedArr(key, arr, hasComma)
}

const displayObject = (key, nestedObj, hasComma) => {
  const obj = _.reduce(nestedObj.value, (obj, value, key) => {
    return _.extend(obj, {
      [key]: { value, from: nestedObj.from },
    })
  }, {})

  return displayNestedObj(key, obj, hasComma)
}

const getSpan = (key, obj, hasComma, isArray, schemaDesc, schemaDefault) => {
  let description = (schemaDesc.hasOwnProperty(key)) ? schemaDesc[key] : ''
  let defaultVal = (schemaDefault.hasOwnProperty(key)) ? `default: ${schemaDefault[key]}` : false

  return (
    <div key={key} className='line'>
      {getKey(key, isArray, description)}
      {getColon(isArray)}
      <Tooltip title={defaultVal} placement='right' className='cy-tooltip'>
        <span className={obj.from}>
          {getString(obj.value)}
          {`${obj.value}`}
          {getString(obj.value)}
        </span>
      </Tooltip>
      {getComma(hasComma)}
    </div>
  )
}

const getKey = (key, isArray, value) => {
  if (!value) {
    return isArray ? '' : <span className='key'>{key}</span>
  }

  return isArray ? '' : <Tooltip title={value} className='cy-tooltip'><span className='key'>{key}</span></Tooltip>
}

const getColon = (isArray) => {
  return isArray ? '' : <span className="colon">:{' '}</span>
}

const getString = (val) => {
  return _.isString(val) ? '\'' : ''
}

const getComma = (hasComma) => {
  return hasComma ? <span className='comma'>,</span> : ''
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
          <td><span className='plugin'>plugin</span></td>
          <td>set from plugin file</td>
        </tr>
      </tbody>
    </table>
    <pre className='config-vars'>
      {'{'}
      {display(project.resolvedConfig, schemaDesc, schemaDefault)}
      {'}'}
    </pre>
  </div>
))

export default Configuration
