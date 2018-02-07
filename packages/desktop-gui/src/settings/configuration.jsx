import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Tooltip from '@cypress/react-tooltip'

import ipc from '../lib/ipc'

const display = (obj) => {
  const keys = _.keys(obj)
  const lastKey = _.last(keys)

  return _.map(obj, (value, key) => {
    const hasComma = lastKey !== key
    if (value.from == null) {
      return displayNestedObj(key, value, hasComma)
    }

    if (value.isArray) {
      return getSpan(key, value, hasComma, true)
    }

    if (_.isObject(value.value)) {
      const realValue = value.value.toJS ? value.value.toJS() : value.value

      if (_.isArray(realValue)) {
        return displayArray(key, value, hasComma)
      }

      return displayObject(key, value, hasComma)
    }

    return getSpan(key, value, hasComma)
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

const getSpan = (key, obj, hasComma, isArray) => {
  return (
    <div key={key} className='line'>
      {getKey(key, isArray)}
      {getColon(isArray)}
      <Tooltip title={obj.from || ''} placement='right' className='cy-tooltip'>
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

const getKey = (key, isArray) => {
  return isArray ? '' : <span className='key'>{key}</span>
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
          <td>set from cypress.json</td>
        </tr>
        <tr className='config-keys'>
          <td><span className='envFile'>envFile</span></td>
          <td>set from cypress.env.json</td>
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
      {display(project.resolvedConfig)}
      {'}'}
    </pre>
  </div>
))

export default Configuration
