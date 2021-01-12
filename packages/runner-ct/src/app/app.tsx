import cs from 'classnames'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import { Reporter } from '@packages/reporter/src/main'

import errorMessages from '../errors/error-messages'
import State, { RunMode } from '../lib/state'

import { SpecsList } from '../specs/specs-list'
import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import './app.scss'
import { ReporterHeader } from './reporter-header'
import { useWindowSize } from '../lib/useWindowSize'
import EventManager from '../lib/event-manager'

// Cypress.ConfigOptions only appears to have internal options.
// TODO: figure out where the "source of truth" should be for
// an internal options interface.
export interface ExtendedConfigOptions extends Cypress.ConfigOptions {
  projectName: string,
  browsers: any[],
}

export interface AppProps {
  state: State;
  // eslint-disable-next-line
  eventManager: typeof EventManager
  config: ExtendedConfigOptions
}

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const windowSize = useWindowSize()

    const { state, eventManager, config } = props
    const [isReporterResizing, setIsReporterResizing] = React.useState(false)

    // the viewport + padding left and right or fallback to default size
    const defaultIframeWidth = config.viewportWidth ? config.viewportWidth + 32 : 500

    return (
      <>
        <SplitPane
          split="vertical"
          primary="second"
          minSize={100}
          // calculate maxSize of IFRAMES preview to not cover specs list and command log
          maxSize={windowSize.width - 400}
          defaultSize={defaultIframeWidth}
          onDragStarted={() => setIsReporterResizing(true)}
          onDragFinished={() => setIsReporterResizing(false)}
          className={cs('reporter-pane', { 'is-reporter-resizing': isReporterResizing })}
        >
          <SplitPane
            primary="second"
            split="vertical"
            defaultSize={(windowSize.width - defaultIframeWidth) / 100 * 70}
            minSize={200}
          >
            <SpecsList state={state} config={config} />
            <div>
              {state.spec && (
                <Reporter
                  runMode={state.runMode}
                  runner={eventManager.reporterBus}
                  spec={state.spec}
                  allSpecs={state.multiSpecs}
                  // @ts-ignore
                  error={errorMessages.reporterError(state.scriptError, state.spec.relative)}
                  firefoxGcInterval={config.firefoxGcInterval}
                  resetStatsOnSpecChange={state.runMode === 'single'}
                  renderReporterHeader={(props) => <ReporterHeader {...props} />}
                />
              )}
            </div>
          </SplitPane>

          <div className="runner runner-ct container">
            <Header {...props} />
            <Iframes {...props} />
            <Message state={state} />
          </div>
        </SplitPane>

        {/* these pixels help ensure the browser has painted when taking a screenshot */}
        <div className='screenshot-helper-pixels'>
          <div /><div /><div /><div /><div /><div />
        </div>
      </>
    )
  },
)

App.propTypes = {
  config: PropTypes.shape({
    browsers: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      majorVersion: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),
      version: PropTypes.string.isRequired,
    })).isRequired,
    integrationFolder: PropTypes.string.isRequired,
    numTestsKeptInMemory: PropTypes.number.isRequired,
    projectName: PropTypes.string.isRequired,
    viewportHeight: PropTypes.number.isRequired,
    viewportWidth: PropTypes.number.isRequired,
  }).isRequired,
  // TODO: figure out why ts-expect-error isn't working.
  // Do we even need this anymore? We have TypeSrfipt.
  // eventManager: PropTypes.shape({
  //   getCypress: PropTypes.object,
  //   notifyRunningSpec: PropTypes.func.isRequired,
  //   reporterBus: PropTypes.shape({
  //     emit: PropTypes.func.isRequired,
  //     on: PropTypes.func.isRequired,
  //   }).isRequired,
  // }).isRequired,
  state: PropTypes.instanceOf(State).isRequired,
}

export default App
