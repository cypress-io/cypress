import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import App from '../lib/app'

@observer
class Config extends Component {
  constructor (props) {
    super(props)

    this.resolvedConfig = this.props.project.resolvedConfig
  }

  render () {
    let config  = _.omit(this.resolvedConfig, 'environmentVariables')
    let envVars = this.resolvedConfig.environmentVariables

    return (
      <div id='config'>
        <h5>
          Resolved Configuration:{' '}
          <a href="#" onClick={this.openHelp}>
            <i className="fa fa-question-circle"></i>
          </a>
        </h5>
        <pre className='config-vars'>
          { `{` }
          { this._display(config, { comma: true }) }
          <span className='envVars'>
            <span className='key'>environmentVariables</span>
            <span className='colon'>:</span>{' '}
            { `{` }
            { this._display(envVars) }
            { `  }\n` }
          </span>
          { `}` }
        </pre>
        <h5>
          Configuration Value Set:{' '}
        </h5>
        <pre>
          <table className='table'>
            <tbody>
              <tr className='config-keys'>
                <td><span className='default'>default</span></td>
                <td>default</td>
              </tr>
              <tr className='config-keys'>
                <td><span className='config'>config</span></td>
                <td>cypress.json</td>
              </tr>
              <tr className='config-keys'>
                <td><span className='envFile'>envFile</span></td>
                <td>cypress.env.json</td>
              </tr>
              <tr className='config-keys'>
                <td><span className='env'>env</span></td>
                <td>environment variables</td>
              </tr>
              <tr className='config-keys'>
                <td><span className='cli'>CLI</span></td>
                <td>CLI arguments</td>
              </tr>
            </tbody>
          </table>
        </pre>
      </div>
    )
  }

  _getSpan (key, obj, comma) {
    return (
      <div key={key} className='line'>
        <span className='key'>{key}</span>
        <span className='colon'>:</span>{' '}
        <span className={obj.from} data-toggle='tooltip' title={obj.from}>
          {this._getString(obj.value)}
          {obj.value}
          {this._getString(obj.value)}
        </span>
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

  _openHelp () {
    App.ipc('external:open', 'https://on.cypress.io/guides/configuration')
  }
}

export default Config
