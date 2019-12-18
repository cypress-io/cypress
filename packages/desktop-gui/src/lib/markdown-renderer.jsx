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
    return (
      <span ref={(node) => this.node = node}
        dangerouslySetInnerHTML={{
          __html: md.render(this.props.markdown),
        }}>
      </span>
    )
  }
}
