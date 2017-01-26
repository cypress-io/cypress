import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from 'rc-tooltip'
import Collapse, { Panel } from 'rc-collapse'

import App from '../lib/app'
import { getCiKeys } from '../projects/projects-api'

@observer
class Config extends Component {
  state = {
    ciKeys: [],
    isLoadingCiKeys: true,
  }

  componentWillMount () {
    getCiKeys().then((ciKeys = []) => {
      this.setState({
        ciKeys,
        isLoadingCiKeys: false,
      })
    })
  }

  render () {
    return (
      <div id='config'>
        <div className='config-wrapper'>
          <Collapse>
            {this._configSection()}
            {this._ciKeysSection()}
          </Collapse>
        </div>
      </div>
    )
  }

  _configSection () {
    const config = this.props.project.resolvedConfig

    return (
      <Panel header='Configuration' key='config' className='form-horizontal'>
        <a href='#' className='pull-right' onClick={this._openHelp}>
          <i className='fa fa-info-circle'></i>{' '}
          Learn more
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
          </tbody>
        </table>
        <pre className='config-vars'>
          { `{` }
          { this._display(config) }
          { `}` }
        </pre>
      </Panel>
    )
  }

  _getSpan (key, obj, hasComma) {
    return (
      <div key={key} className='line'>
        <span className='key'>{key}</span>
        <span className='colon'>:</span>{' '}
        <Tooltip
          overlay={obj.from || ''}
        >
          <span className={obj.from}>
            {this._getString(obj.value)}
            {`${obj.value}`}
            {this._getString(obj.value)}
          </span>
        </Tooltip>
        {this._getComma(hasComma)}
      </div>
    )
  }

  _getString (val) {
    return _.isString(val) ? "'" : ""
  }

  _getComma (hasComma) {
    return hasComma ? <span className='comma'>,</span> : ''
  }

  _display (obj) {
    let keys = _.keys(obj)
    let lastKey = _.last(keys)

    return _.map(obj, (value, key) => {
      let hasComma = lastKey !== key
      if (value.from == null) {
        return this._nested(key, value, hasComma)
      } else {
        return this._getSpan(key, value, hasComma)
      }
    })
  }

  _nested (key, value, hasComma) {
    return (
      <span key={key}>
        <span className='nested'>
          <span className='key'>{key}</span>
          <span className='colon'>:</span>{' '}
          { `{` }
          { this._display(value) }
        </span>
        <span className='line'>{`}`}{this._getComma(hasComma)}</span>
        <br />
      </span>
    )
  }

  _ciKeysSection () {
    if (this._notSetupForCi()) return null

    return (
      <Panel header='CI Keys' key='ci-keys' className='form-horizontal config-ci-keys'>
        <a href='#' className='pull-right' onClick={this._openCiGuide}>
          <i className='fa fa-info-circle'></i>{' '}
          Learn More
        </a>
        <p className='text-muted'>
          CI Keys allow you to record test results, screenshots and videos in Cypress.
          {this._hasCiKeys() ? ' To record your builds, run this command:' : ''}
        </p>
        {this._hasCiKeys() ? <pre><code>cypress ci {this.state.ciKeys[0].id}</code></pre> : null}
        {this._ciKeys()}
        <p className='text-muted manage-btn'>
          <a href='#' onClick={this._openAdminCiKeys} >
            <i className='fa fa-key'></i> Add or Remove CI Keys
          </a>
        </p>
      </Panel>
    )
  }

  _hasCiKeys () {
    return !this.state.isLoadingCiKeys && this.state.ciKeys.length
  }

  _notSetupForCi () {
    return !this.props.project.id || !this.props.project.valid
  }

  _ciKeys = () => {
    if (this.state.isLoadingCiKeys) {
      return (
        <p className='loading-ci-keys'>
          <i className='fa fa-spinner fa-spin'></i>{' '}
          Loading CI keys...
        </p>
      )
    }

    return null
  }

  _openHelp (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/guides/configuration')
  }

  _openCiGuide (e) {
    e.preventDefault()
    App.ipc('external:open', 'https://on.cypress.io/guides/continuous-integration')
  }

  _openAdminCiKeys = (e) => {
    e.preventDefault()
    App.ipc('external:open', `https://on.cypress.io/dashboard/projects/${this.props.project.id}/settings`)
  }
}

export default Config
