import React, { Component } from 'react'
import { observer } from 'mobx-react'
import MarkdownRenderer from '../lib/markdown-renderer'

@observer
class WarningMessage extends Component {
  render () {
    const warningText = this.props.warning.message.split('\n').join('<br />')

    return (
      <div className='alert alert-warning'>
        <p className='header'>
          <i className='fa fa-warning'></i>{' '}
          <strong>Warning</strong>
        </p>
        <div>
          <MarkdownRenderer markdown={warningText}/>
          {this.props.onTryAgain &&
            <button className="retry-button btn btn-default btn-sm" onClick={this.props.onTryAgain}>
              <i className='fa fa-refresh' /> Try Again
            </button>
          }
        </div>
        <button className='btn btn-link close' onClick={this.props.onClearWarning}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
  }
}

export default WarningMessage
