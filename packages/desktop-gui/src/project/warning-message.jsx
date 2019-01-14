import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Markdown from 'markdown-it'

import ipc from '../lib/ipc'

const md = new Markdown({
  html: true,
  linkify: true,
})

@observer
class WarningMessage extends Component {
  componentDidMount () {
    this.warningMessageNode.addEventListener('click', this._clickHandler)
  }

  componentWillUnmount () {
    this.warningMessageNode.removeEventListener('click', this._clickHandler)
  }

  _clickHandler (e) {
    if (e.target.href) {
      e.preventDefault()

      return ipc.externalOpen(e.target.href)
    }
  }

  render () {
    const warningText = this.props.warning.message.split('\n').join('<br />')

    return (
      <div className='alert alert-warning'>
        <p className='header'>
          <i className='fa fa-warning'></i>{' '}
          <strong>Warning</strong>
        </p>
        <div ref={(node) => this.warningMessageNode = node} dangerouslySetInnerHTML={{
          __html: md.render(warningText),
        }}></div>
        <button className='btn btn-link close' onClick={this.props.onClearWarning}>
          <i className='fa fa-remove' />
        </button>
      </div>
    )
  }
}

export default WarningMessage
