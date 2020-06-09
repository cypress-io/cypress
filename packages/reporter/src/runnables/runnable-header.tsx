import React, { Component, ReactElement } from 'react'

import FileOpener from '../opener/file-opener'

const renderRunnableHeader = (children:ReactElement) => <div className="runnable-header">{children}</div>

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
}

class RunnableHeader extends Component<RunnableHeaderProps> {
  render () {
    const { spec } = this.props
    const relativeSpecPath = spec.relative

    if (spec.relative === '__all') {
      return renderRunnableHeader(
        <span>All Specs</span>,
      )
    }

    const fileDetails = {
      absoluteFile: spec.absolute,
      column: 0,
      line: 0,
      originalFile: relativeSpecPath,
      relativeFile: relativeSpecPath,
    }

    return renderRunnableHeader(
      <FileOpener fileDetails={fileDetails} />,
    )
  }
}

export default RunnableHeader
