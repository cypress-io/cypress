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
      return displayNested(key, value, hasComma)
    } else if (_.isObject(value.value)) {
      return displayObject(key, value, hasComma)
    } else {
      return getSpan(key, value, hasComma)
    }
  })
}

const displayNested = (key, value, hasComma) => (
  <span key={key}>
    <span className='nested'>
      <span className='key'>{key}</span>
      <span className='colon'>:</span>{' '}
      {'{'}
      {display(value)}
    </span>
    <span className='line'>{'}'}{getComma(hasComma)}</span>
    <br />
  </span>
)

const displayObject = (key, nestedObj, hasComma) => {
  const obj = _.reduce(nestedObj.value, (obj, value, key) => {
    return _.extend(obj, {
      [key]: { value, from: nestedObj.from },
    })
  }, {})

  return displayNested(key, obj, hasComma)
}

const getSpan = (key, obj, hasComma) => {
  return (
    <div key={key} className='line'>
      <span className='key'>{key}</span>
      <span className='colon'>:</span>{' '}
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
