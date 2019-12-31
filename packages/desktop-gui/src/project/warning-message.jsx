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
          <i className='fas fa-exclamation-triangle'></i>{' '}
          <strong>Warning</strong>
        </p>
        <div>
          <MarkdownRenderer markdown={warningText}/>
        </div>
        <button className='btn btn-link close' onClick={this.props.onClearWarning}>
          <i className='fas fa-times' />
        </button>
      </div>
    )
  }
}

export default WarningMessage
