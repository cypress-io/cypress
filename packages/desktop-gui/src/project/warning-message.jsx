import cs from 'classnames'
import React, { Component } from 'react'
import { observer } from 'mobx-react'
import MarkdownRenderer from '../lib/markdown-renderer'

@observer
class WarningMessage extends Component {
  render () {
    const { warning } = this.props
    const warningText = warning.message.split('\n').join('<br />')

    return (
      <div className='alert alert-warning'>
        <p className='header'>
          <i className='fas fa-exclamation-triangle'></i>{' '}
          <strong>Warning</strong>
        </p>
        <div>
          <MarkdownRenderer markdown={warningText}/>
          {warning.isRetryable &&
            <button
              className='retry-button btn btn-default btn-sm'
              disabled={warning.isRetrying}
              onClick={this.props.onRetry}
            >
              <i className={cs('fas fa-sync', { 'fa-spin': warning.isRetrying })} />
              {warning.isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          }
        </div>
        <button className='btn btn-link close' onClick={this.props.onDismissWarning}>
          <i className='fas fa-times' />
        </button>
      </div>
    )
  }
}

export default WarningMessage
