import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'
// import { Reporter } from '@packages/reporter'

// import errorMessages from '../errors/error-messages'
import util from '../lib/util'
import State from '../lib/state'

import SpecsList from '../specs/specs-list'
import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import './app.scss'

// {this.props.state.spec && (
//   <Reporter
//     runMode={this.props.state.runMode}
//     runner={this.props.eventManager.reporterBus}
//     spec={this.props.state.spec}
//     allSpecs={this.props.state.multiSpecs}
//     autoScrollingEnabled={this.props.config.state.autoScrollingEnabled}
//     error={errorMessages.reporterError(this.props.state.scriptError, spec.relative)}
//     firefoxGcInterval={this.props.config.firefoxGcInterval}
//     resetStatsOnSpecChange={this.props.state.runMode === 'single'}
//   />
// )}

const App = observer(
  function App (props) {
    const { state, children } = props

    return (
      <>
        <SplitPane split="vertical" minSize={250} defaultSize="20%" >
          <SpecsList state={state} />
          <div className="runner runner-ct container">
            <Header {...props} />
            <Iframes {...props} />
            <Message state={state} />
            {children}
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

App.defaultProps = {
  window,
  util,
}

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
