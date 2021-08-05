import React from 'react'
import Markdown from 'markdown-it'

const md = new Markdown({
  html: true,
  linkify: true,
})

export default class MarkdownRenderer extends React.PureComponent {
  componentDidMount () {
    this.node.addEventListener('click', this.props.clickHandler)
  }

  componentWillUnmount () {
    this.node.removeEventListener('click', this.props.clickHandler)
  }

  render () {
    let renderFn = md.render

    if (this.props.noParagraphWrapper) {
      // prevent markdown-it from wrapping the output in a <p> tag
      renderFn = md.renderInline
    }

    return (
      <div ref={(node) => this.node = node}
        dangerouslySetInnerHTML={{
          __html: renderFn.call(md, this.props.markdown),
        }}>
      </div>
    )
  }
}
