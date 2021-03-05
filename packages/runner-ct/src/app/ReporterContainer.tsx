import { observer } from 'mobx-react'
import * as React from 'react'
import cs from 'classnames'

import { Reporter } from '@packages/reporter/src/main'
import errorMessages from '../errors/error-messages'
import EventManager from '../lib/event-manager'
import State from '../lib/state'
import styles from './RunnerCt.module.scss'
import { ReporterHeader } from './ReporterHeader'
import { KeyboardHelper, NoSpecSelected } from './NoSpecSelected'

interface ReporterContainerProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
  onSelectSpecRequest: () => void
}

export const ReporterContainer = observer(
  function ReporterContainer (props: ReporterContainerProps) {
    if (!props.state.spec) {
      return (
        <div className='no-spec'>
          <KeyboardHelper />
          <NoSpecSelected
            onSelectSpecRequest={props.onSelectSpecRequest}
          />
        </div>
      )
    }

    return (
      <Reporter
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
