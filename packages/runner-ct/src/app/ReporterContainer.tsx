import { observer } from 'mobx-react'
import * as React from 'react'
import cs from 'classnames'

import { Reporter } from '@packages/reporter/src/main'
import errorMessages from '../errors/error-messages'
import EventManager from '../lib/event-manager'
import State from '../lib/state'
import styles from './RunnerCt.module.scss'
import { ReporterHeader } from './ReporterHeader'
import { NoSpecSelected } from './NoSpecSelected'

interface ReporterContainerProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
}

export const ReporterContainer = observer(
  function ReporterContainer (props: ReporterContainerProps) {
    if (!props.state.spec) {
      return (
        <div className='no-spec' data-cy="no-spec-selected-reporter">
          <NoSpecSelected />
        </div>
      )
    }

    return (
      <Reporter
        data-cy="reporter"
        runMode={props.state.runMode}
        runner={props.eventManager.reporterBus}
        className={cs({ 'display-none': props.state.screenshotting }, styles.reporter)}
        spec={props.state.spec}
        specRunId={props.state.specRunId}
        allSpecs={props.state.multiSpecs}
        error={errorMessages.reporterError(props.state.scriptError, props.state.spec.relative)}
        firefoxGcInterval={props.config.firefoxGcInterval}
        resetStatsOnSpecChange={props.state.runMode === 'single'}
        renderReporterHeader={(props) => <ReporterHeader {...props} />}
        experimentalStudioEnabled={false}
      />
    )
  },
)
