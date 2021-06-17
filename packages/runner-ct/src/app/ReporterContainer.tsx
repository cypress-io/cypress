import React, { useEffect, useLayoutEffect } from 'react'
// import cs from 'classnames'
// import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
// import { Reporter } from '@packages/reporter/src/main'

import { start } from '@packages/reporter-vue'

// import errorMessages from '../errors/error-messages'
// import EventManager from '../lib/event-manager'
// import State from '../lib/state'
import { namedObserver } from '../lib/mobx'

// // import { ReporterHeader } from './ReporterHeader'
// import { NoSpec } from './NoSpec'

// import styles from './RunnerCt.module.scss'

// interface ReporterContainerProps {
//   state: State
//   eventManager: typeof EventManager
//   config: Cypress.RuntimeConfigOptions
// }

export const ReporterContainer = React.memo(namedObserver('ReporterContainer',
  (props) => {
    // @ts-ignore
    window.eventManager = props.eventManager

    //     runMode={props.state.runMode}
    //     runner={props.eventManager.reporterBus}
    //     className={cs({ 'display-none': props.state.screenshotting }, styles.reporter)}
    //     spec={props.state.spec}
    //     specRunId={props.state.specRunId}
    //     allSpecs={props.state.multiSpecs}
    //     error={errorMessages.reporterError(props.state.scriptError, props.state.spec.relative)}
    //     firefoxGcInterval={props.config.firefoxGcInterval}
    //     resetStatsOnSpecChange={props.state.runMode === 'single'}
    useLayoutEffect(() => {
      start({
      // runMode: props.state.runMode,
        reporterBus: props.eventManager.reporterBus,
        state: props.state,
      // spec: props.stat.spec,
      })
    }, [])

    // useEffect(() => {
    //   console.log(props.state)
    // start({
    // // runMode: props.state.runMode,
    //   reporterBus: props.eventManager.reporterBus,
    //   state: props.state,
    // // spec: props.stat.spec,
    // })
    // }, [props.state])

    return (
      <div id="vue-app">
        { Date.now() }
      Vue App
      </div>
    )

    // return (
    //   <Reporter
    //     data-cy="reporter"
    //     runMode={props.state.runMode}
    //     runner={props.eventManager.reporterBus}
    //     className={cs({ 'display-none': props.state.screenshotting }, styles.reporter)}
    //     spec={props.state.spec}
    //     specRunId={props.state.specRunId}
    //     allSpecs={props.state.multiSpecs}
    //     error={errorMessages.reporterError(props.state.scriptError, props.state.spec.relative)}
    //     firefoxGcInterval={props.config.firefoxGcInterval}
    //     resetStatsOnSpecChange={props.state.runMode === 'single'}
    //     renderReporterHeader={renderReporterHeader}
    //     experimentalStudioEnabled={false}
    //   />
    // )
  }))

/**

 */
