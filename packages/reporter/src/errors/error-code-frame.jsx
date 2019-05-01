import React, { Component } from 'react'
import { observer } from 'mobx-react'
import Prism from 'prismjs'

@observer
class ErrorCodeFrame extends Component {
  componentDidMount () {
    Prism.highlightAllUnder(this.refs.codeFrame)
  }

  render () {
    const { file, line, column, frame } = this.props.codeFrame
    const language = this.props.codeFrame.language || 'text'

    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path'>{file}:{line}:{column}</div>
        <pre ref='codeFrame' data-line={3}>
          <code className={`language-${language}`}>{frame}</code>
        </pre>
      </div>
    )
  }
}

export default ErrorCodeFrame
