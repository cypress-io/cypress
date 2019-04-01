import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Prism from 'prismjs'

@observer
class ErrorCodeFrame extends Component {
  componentDidMount () {
    Prism.highlightAllUnder(this.refs.codeFrame)
  }

  render () {
    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path'>{this.props.path}:{this.props.line}:{this.props.column}</div>
        <pre ref='codeFrame' data-line={this.props.line} className='line-numbers'>
          {/* TODO: language must be dynamic */}
          <code className='language-javascript'>{this.props.src}</code>
        </pre>
      </div>
    )
  }
}

export default ErrorCodeFrame
