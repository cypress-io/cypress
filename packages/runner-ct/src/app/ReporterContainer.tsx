import * as React from 'react'
import cs from 'classnames'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
import { Reporter } from '@packages/reporter/src/main'

import { errorMessages, namedObserver, EventManager } from '@packages/runner-shared'
import State from '../lib/state'
import { ReporterHeader } from './ReporterHeader'
import { NoSpec } from './NoSpec'

import styles from './RunnerCt.module.scss'

interface ReporterContainerProps {
  state: State
  eventManager: EventManager
  config: {
    configFile: string
    [key: string]: unknown
  }
}

export const ReporterContainer = namedObserver('ReporterContainer',
  (props: ReporterContainerProps) => {
    if (!props.state.spec) {
      return (
        <div className='no-spec' data-cy="no-spec-selected-reporter">
          <NoSpec />
        </div>
      )
    }

    return (
      <Reporter
        data-cy="reporter"
        runMode={props.state.runMode}
        runner={props.eventManager.reporterBus}
        className={cs({ 'display-none': props.state.screenshotting }, styles.reporter)}
        runnerStore={props.state}
        error={errorMessages.reporterError(props.state.scriptError, props.state.spec.relative)}
        resetStatsOnSpecChange={props.state.runMode === 'single'}
        renderReporterHeader={renderReporterHeader}
        experimentalStudioEnabled={false}
      />
    )
  })

const renderReporterHeader = (props: ReporterHeaderProps) => <ReporterHeader {...props} />
