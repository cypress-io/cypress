import React from 'react'
import Markdown from 'markdown-it'

import ipc from '../lib/ipc'

const md = new Markdown({
  html: true,
  linkify: true,
})

export default class MarkdownRenderer extends React.PureComponent {
  componentDidMount () {
    this.node.addEventListener('click', this._clickHandler)
  }

  componentWillUnmount () {
    this.node.removeEventListener('click', this._clickHandler)
  }

  _clickHandler (e) {
    if (e.target.href) {
      e.preventDefault()

      return ipc.externalOpen(e.target.href)
    }
  }

  render () {
    let html = md.render(this.props.markdown)

    // markdown-it wraps the markdown in a <p> tag, this removes it to prevent
    // styling issues
    if (this.props.noParagraphWrapper) {
      const matches = /^<p>([^<]*)<\/p>\n$/.exec(html)

      if (matches) {
        html = matches[1]
      }
    }

    return (
      <span ref={(node) => this.node = node}
        dangerouslySetInnerHTML={{
          __html: html,
        }}>
      </span>
    )
  }
}
