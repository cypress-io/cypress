import React, { Component, ReactElement } from 'react'

import FileNameOpener from '../lib/file-name-opener'

const renderRunnableHeader = (children: ReactElement) => <div className="runnable-header">{children}</div>

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
}

class RunnableHeader extends Component<RunnableHeaderProps> {
  render () {
    const { spec } = this.props

    const relativeSpecPath = spec.relative

    if (spec.relative === '__all') {
      if (spec.specFilter) {
        return renderRunnableHeader(
          <span><span>Specs matching "{spec.specFilter}"</span></span>,
        )
      }

      return renderRunnableHeader(
        <span><span>All Specs</span></span>,
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
      <FileNameOpener fileDetails={fileDetails} />,
    )
  }
}

export default RunnableHeader
