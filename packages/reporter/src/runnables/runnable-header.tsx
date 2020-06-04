import React, { Component } from 'react'

import FileOpener from '../opener/file-opener'

interface RunnableHeaderProps {
  specPath: string
}

class RunnableHeader extends Component<RunnableHeaderProps> {
  render () {
    const { specPath } = this.props
    const relativeSpecPath = window.Cypress?.spec.relative
    const fileDetails = {
      absoluteFile: specPath,
      column: 0,
      line: 0,
      originalFile: relativeSpecPath,
      relativeFile: relativeSpecPath,
    }

    return (
      <div className="runnable-header">
        { relativeSpecPath === '__all' ? <span>All Specs</span> : <FileOpener fileDetails={fileDetails} /> }
      </div>
    )
  }
}

export default RunnableHeader
