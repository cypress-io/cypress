import { observer } from 'mobx-react'
import React, { Component, ReactElement } from 'react'

import { StatsStore } from '../header/stats-store'
import { formatDuration, getFilenameParts } from '../lib/util'
import OpenFileInIDE from '../lib/open-file-in-ide'
import FileNameOpener from '../lib/file-name-opener'
import TextIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/document-text_x16.svg'

const renderRunnableHeader = (children: ReactElement) => <div className="runnable-header">{children}</div>

interface RunnableHeaderProps {
  spec: Cypress.Cypress['spec']
  statsStore: StatsStore
}

@observer
class RunnableHeader extends Component<RunnableHeaderProps> {
  render () {
    const { spec, statsStore } = this.props

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

    const displayFileName = () => {
      const specParts = getFilenameParts(spec.name)

      return (
        <>
          <strong>{specParts[0]}</strong>{specParts[1]}
        </>
      )
    }

    const fileDetails = {
      absoluteFile: spec.absolute,
      column: 0,
      displayFile: displayFileName(),
      line: 0,
      originalFile: relativeSpecPath,
      relativeFile: relativeSpecPath,
    }

    const openInIde = '__vite__' in window
      ? (
        <OpenFileInIDE fileDetails={fileDetails}>
          <TextIcon />
        </OpenFileInIDE>
      )
      : <FileNameOpener fileDetails={fileDetails} hasIcon />

    return renderRunnableHeader(
      <>
        {openInIde}
        {Boolean(statsStore.duration) && (
          <span className='duration'>{formatDuration(statsStore.duration)}</span>
        )}
      </>,
    )
  }
}

export default RunnableHeader
