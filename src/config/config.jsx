import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Tooltip from 'rc-tooltip'

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
    this.resolvedConfig = this.props.project.resolvedConfig

    let config  = _.omit(this.resolvedConfig, 'environmentVariables')
    let envVars = this.resolvedConfig.environmentVariables

    return (
      <div id='config'>
        <div className='config-wrapper'>
          <section className='form-horizontal'>
            <h2>
              Resolved Configuration:{' '}
              <a href='#' className='pull-right' onClick={this._openHelp}>
                <i className='fa fa-info-circle'></i>{' '}
                Learn more
              </a>
            </h2>
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
              { this._display(config, { comma: true }) }
              <span className='envVars'>
                <span className='key'>env</span>
                <span className='colon'>:</span>{' '}
                { `{` }
                { this._display(envVars) }
              </span>
              <span className='line'>{`}`}</span>
              <br />
              { `}` }
            </pre>
          </section>
          {this._ciKeysSection()}
        </div>
      </div>
    )
  }

  _getSpan (key, obj, comma) {
    return (
      <div key={key} className='line'>
        <span className='key'>{key}</span>
        <span className='colon'>:</span>{' '}
        <Tooltip
          overlay={obj.from}
        >
          <span className={obj.from}>
            {this._getString(obj.value)}
            {`${obj.value}`}
            {this._getString(obj.value)}
          </span>
        </Tooltip>
        {this._getComma(comma)}
      </div>
    )
  }

  _getString (val) {
    return _.isString(val) ? "'" : ""
  }

  _getComma (bool) {
    return bool ? <span className='comma'>,</span> : ''
  }

  _display (obj, opts = {}) {
    let keys = _.keys(obj)
    let last = _.last(keys)

    return _.map(obj, (value, key) => {
      let hasComma = opts.comma || last !== key
      return this._getSpan(key, value, hasComma)
    })
  }

  _ciKeysSection () {
    if (this._notSetupForCi()) return null

    return (
      <section className='form-horizontal config-ci-keys'>
        <h2>
          CI Keys
          <a href='#' className='pull-right' onClick={this._openCiGuide}>
            <i className='fa fa-info-circle'></i>{' '}
            Learn More
          </a>
        </h2>
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
      </section>
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
    App.ipc('external:open', 'https://on.cypress.io/ci-learn-more')
  }

  _openAdminCiKeys = (e) => {
    e.preventDefault()
    App.ipc('external:open', `https://on.cypress.io/dashboard/projects/${this.props.project.id}/settings`)
  }
}

export default Config
