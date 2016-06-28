import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import { withRouter } from 'react-router'

@withRouter
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
        <h5>Configuration</h5>
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
      </div>
    )
  }

          // { this._displayResolved(config, { comma: true }) }

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
}

export default Config
