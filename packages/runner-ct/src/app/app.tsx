import cs from 'classnames'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
import { Reporter } from '@packages/reporter'

import errorMessages from '../errors/error-messages'
import State from '../lib/state'

import { SpecsList } from '../specs/specs-list'
import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import './app.scss'
import { ReporterHeader } from './ReporterHeader'

interface AppProps {
  state: State;
  // eslint-disable-next-line
  eventManager: typeof import('../lib/event-manager').default
  config: Cypress.ConfigOptions
}

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const { state, eventManager, config } = props
    const [isReporterResizing, setIsReporterResizing] = React.useState(false)

    return (
      <>
        <SplitPane split="vertical" minSize={250} defaultSize="20%" >
          <SpecsList state={state} />
          <SplitPane
            split="vertical"
            primary="second"
            minSize="20%"
            maxSize="80%"
            // the viewport + padding left and right
            defaultSize={config.viewportWidth ? config.viewportWidth + 32 : '20%'}
            onDragStarted={() => setIsReporterResizing(true)}
            onDragFinished={() => setIsReporterResizing(false)}
            className={cs({ 'is-reporter-resizing': isReporterResizing })}
          >
            <div>
              {state.spec && (
                <Reporter
                  runMode={state.runMode}
                  runner={eventManager.reporterBus}
                  spec={state.spec}
                  allSpecs={state.multiSpecs}
                  autoScrollingEnabled={config.state.autoScrollingEnabled}
                  // @ts-ignore
                  error={errorMessages.reporterError(state.scriptError, state.spec.relative)}
                  firefoxGcInterval={config.firefoxGcInterval}
                  resetStatsOnSpecChange={state.runMode === 'single'}
                  renderReporterHeader={(props) => <ReporterHeader {...props} />}
                />
              )}
            </div>

            <div className="runner runner-ct container">
              <Header {...props} />
              <Iframes {...props} />
              <Message state={state} />
            </div>
          </SplitPane>
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
  runMode: PropTypes.oneOf(['single', 'multi']),
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
  // @ts-expect-error
  eventManager: PropTypes.shape({
    notifyRunningSpec: PropTypes.func.isRequired,
    reporterBus: PropTypes.shape({
      emit: PropTypes.func.isRequired,
      on: PropTypes.func.isRequired,
    }).isRequired,
  }).isRequired,
  state: PropTypes.instanceOf(State).isRequired,
}

export default App
