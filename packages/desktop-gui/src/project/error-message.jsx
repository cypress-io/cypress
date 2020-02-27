import _ from 'lodash'
import React, { Component } from 'react'
import { observer } from 'mobx-react'

import ipc from '../lib/ipc'
import { configFileFormatted } from '../lib/config-file-formatted'

import Markdown from 'markdown-it'

const _copyErrorDetails = (err) => {
  let details = [
    `**Message:** ${err.message}`,
  ]

  if (err.details) {
    details.push(`**Details:** ${err.details}`)
  }

  if (err.title) {
    details.unshift(`**Title:** ${err.title}`)
  }

  if (err.stack2) {
    details.push(`**Stack trace:**\n\`\`\`\n${err.stack2}\n\`\`\``)
  }

  ipc.setClipboardText(details.join('\n\n'))
}

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
        <details className='details-body'>
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
            <i className='fas fa-exclamation-triangle'></i>{' '}
            <strong>{err.title || 'An unexpected error occurred'}</strong>
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
            {err.stack2 && (
              <details className='stacktrace'>
                <summary>Stack trace</summary>
                <pre>{err.stack2}</pre>
              </details>
            )}
          </span>
          <button
            className='btn btn-default btn-sm'
            onClick={() => {
              _copyErrorDetails(err)
            }}
          >
            <i className='fas fa-copy'></i>{' '}
            Copy to Clipboard
          </button>
          <button
            className='btn btn-default btn-sm'
            onClick={this.props.onTryAgain}
          >
            <i className='fas fa-sync-alt'></i>{' '}
            Try Again
          </button>
        </div>
      </div>
    )
  }
}

export default ErrorMessage
