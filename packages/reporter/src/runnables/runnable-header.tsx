import { observer } from 'mobx-react'
import React, { Component, ReactElement } from 'react'

import FileNameOpener from '../lib/file-name-opener'
import { StatsStore } from '../header/stats-store'

const renderRunnableHeader = (children: ReactElement) => <div className="runnable-header">{children}</div>

const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

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

    const fileDetails = {
      absoluteFile: spec.absolute,
      column: 0,
      line: 0,
      originalFile: relativeSpecPath,
      relativeFile: relativeSpecPath,
    }

    return renderRunnableHeader(
      <>
        <FileNameOpener fileDetails={fileDetails} />
        {Boolean(statsStore.duration) && (
          <span className='duration'>{formatDuration(statsStore.duration)}</span>
        )}
      </>,
    )
  }
}

export default RunnableHeader
