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
    // since we pull out 2 lines above the highlighted code, it will always
    // be the 3rd line unless it's at the top of the file (lines 1 or 2)
    const highlightLine = line < 3 ? line : 3

    return (
      <div className='test-error-code-frame'>
        <div className='runnable-err-code-frame-file-path' onClick={this._openFile}>{file}:{line}:{column}</div>
        <pre ref='codeFrame' data-line={highlightLine}>
          <code className={`language-${language}`}>{frame}</code>
        </pre>
      </div>
    )
  }

  _openFile = () => {
    this.props.onOpenFile(this.props.codeFrame)
  }
}

export default ErrorCodeFrame
