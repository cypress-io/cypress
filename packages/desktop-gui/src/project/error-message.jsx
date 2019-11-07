import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import ipc from '../lib/ipc'
import { configFileFormatted } from '../lib/config-file-formatted'

import Markdown from 'markdown-it'

const md = new Markdown({
  html: true,
  linkify: true,
})

const ErrorDetails = observer(({ err }) => {
  let details = _.clone(err.details).split('\n')
  const detailsTitle = details.shift()
  const detailsBody = details.join('\n')

  if (detailsBody) {
    return (
      <pre>
        <details>
          <summary>{detailsTitle}</summary>
          {detailsBody}
        </details>
      </pre>
    )
  }

  return (
    <pre>
      {detailsTitle}
    </pre>
  )
})

@observer
class ErrorMessage extends Component {
  componentDidMount () {
    this.errorMessageNode.addEventListener('click', this._clickHandler)
  }

  componentWillUnmount () {
    this.errorMessageNode.removeEventListener('click', this._clickHandler)
  }

  _clickHandler (e) {
    if (e.target.href) {
      e.preventDefault()

      return ipc.externalOpen(e.target.href)
    }
  }

  render () {
    let err = this.props.project.error

    return (
      <div className='full-alert-container'>
        <div className='full-alert alert alert-danger error'>
          <p className='header'>
            <i className='fa fa-warning'></i>{' '}
            <strong>{err.title || 'Can\'t start server'}</strong>
          </p>
          <span className='alert-content'>
            <div ref={(node) => this.errorMessageNode = node} dangerouslySetInnerHTML={{
              __html: md.render(err.message),
            }}></div>
            {err.details && (
              <ErrorDetails err={err} />
            )}
            {err.portInUse && (
              <div>
                <hr />
                <p>To fix, stop the other running process or change the port in {configFileFormatted(this.props.project.configFile)}</p>
              </div>
            )}
          </span>
          <button
            className='btn btn-default btn-sm'
            onClick={this.props.onTryAgain}
          >
            <i className='fa fa-refresh'></i>{' '}
            Try Again
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorMessage
