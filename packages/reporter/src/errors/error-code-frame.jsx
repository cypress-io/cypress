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

    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path'>{file}:{line}:{column}</div>
        <pre ref='codeFrame' data-line={3}>
          {/* TODO: language must be dynamic */}
          <code className='language-javascript'>{frame}</code>
        </pre>
      </div>
    )
  }
}

export default ErrorCodeFrame
