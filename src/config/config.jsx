import _ from 'lodash'
import React, { Component } from 'react'
import moment from 'moment'
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
          <h5>
            Your project's configuration:{' '}
            <a href='#' className='pull-right' onClick={this._openHelp}>
              <i className='fa fa-question-circle'></i>{' '}
              Learn more
            </a>
          </h5>
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
          <h5>
            Legend
          </h5>
          <table className='table'>
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
          <section className='config-ci-keys'>
            <h5>CI Keys</h5>
            <p className='text-muted'>
              We verify that your project is allowed to run in Continuous Integration by checking the project's CI Key. The following code needs to be in your CI config:{' '}
              <code>cypress ci {`<ci-key>`}</code>{' '}
              <a href='#' onClick={this._openCiGuide}>
                <i className='fa fa-info-circle'></i>{' '}
                Learn More
              </a>
            </p>
            {this._ciKeys()}
            <p>
              <a href='#' onClick={this._openAdminCiKeys}>
                Manage CI Keys <i className='fa fa-external-link'></i>
              </a>
            </p>
          </section>
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

  _ciKeys = () => {
    if (this.state.isLoadingCiKeys) {
      return (
        <p className='loading-ci-keys'>
          <i className='fa fa-spinner fa-spin'></i>{' '}
          Loading CI keys...
        </p>
      )
    }

    const ciKeys = this.state.ciKeys

    if (!ciKeys.length) {
      return (
        <div className='empty empty-small'>No CI Keys</div>
      )
    }

    return (
      <table className='table'>
        <tbody>
          {_.map(ciKeys, (ciKey) => (
            <tr key={ciKey.id}>
              <td className='ci-key'>
                <div className='input-group'>
                  <Tooltip
                    overlay={<span>Copy to clipboard</span>}
                    >
                    <span onClick={this._copyKey} className='input-group-addon'>
                      <i className='fa fa-copy'></i>
                    </span>
                  </Tooltip>
                  <input
                    type='text'
                    className='form-control input-sm'
                    value={ciKey.id}
                    readOnly
                  />
                </div>
              </td>
              <td className='ci-key-date'>
                created { moment(ciKey.createdAt).format('M/D/YYYY')  }
              </td>
              <td className='ci-key-date'>
                used { moment(ciKey.lastUsed).fromNow() }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  _copyKey = (e) => {
    const ciKeyInput = e.currentTarget.parentNode.querySelector('input')

    ciKeyInput.select()

    let message
    try {
      const successful = document.execCommand('copy')
      message = successful ? 'Copied!' : 'Oops, unable to copy'
    } catch (err) {
      message = 'Oops, unable to copy'
    }

    const tooltip = document.querySelector('.rc-tooltip-inner span')
    if (tooltip) {
      tooltip.innerHTML = message
    }
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
    App.ipc('external:open', `https://on.cypress.io/admin/projects/${this.props.project.id}/settings`)
  }
}

export default Config
