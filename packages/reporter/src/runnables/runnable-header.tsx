import React, { Component } from 'react'

import FileOpener from '../files/file-opener'

interface RunnableHeaderProps {
  specPath: string,
  relativeSpecPath: string
}

class RunnableHeader extends Component<RunnableHeaderProps> {
  render () {
    const { specPath, relativeSpecPath } = this.props
    const fileDetails = {
      absoluteFile: specPath,
      column: 0,
      line: 0,
      originalFile: relativeSpecPath,
      relativeFile: relativeSpecPath,
    }

    return (
      <div className="runnable-header">
        <FileOpener fileDetails={fileDetails} />
      </div>
    )
  }
}

export default RunnableHeader
