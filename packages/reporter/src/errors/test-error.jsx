import React, { Component } from 'react'
import Markdown from 'markdown-it'
import FlashOnClick from '../lib/flash-on-click'

const md = new Markdown('zero', {
  linkify: true,
})

const baseSchemas = ['http:', 'ftp:', '//', 'mailto:']
const httpsValidate = md.linkify.__schemas__['http:'].validate

md.enable(['linkify', 'backticks', 'escape'])
baseSchemas.forEach((schema) => {
  md.linkify.add(schema, null)
})

md.linkify.add('https:', {
  validate (text, pos, self) {
    if (!text.match(/on.cypress.io/)) {
      return
    }

    return httpsValidate(text, pos, self)
  },
})

const formattedMessage = (message) => {
  return message ? md.renderInline(message) : ''
}

class TestError extends Component {
  _onErrorClick = (e) => {
    e.stopPropagation()

    if (e.target.tagName === 'A' && e.target.href) {
      e.preventDefault()
      this.props.events.emit('external:open', e.target.href)

      return
    }

    this.props.events.emit('show:error', this.props.model.id)
  }

  render () {
    const { displayMessage } = this.props.model.err

    return (
      <FlashOnClick
        message='Printed output to your console'
        onClick={this._onErrorClick}
      >
        <pre className='test-error' dangerouslySetInnerHTML={{ __html: formattedMessage(displayMessage) }}></pre>
      </FlashOnClick>
    )
  }
}

export default TestError
