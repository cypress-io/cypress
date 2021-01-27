import cs from 'classnames'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import * as React from 'react'
import { Reporter } from '@packages/reporter/src/main'

import errorMessages from '../errors/error-messages'
import State from '../lib/state'

import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import './app.scss'
import { ReporterHeader } from './ReporterHeader'
import { useWindowSize } from '../lib/useWindowSize'
import EventManager from '../lib/event-manager'
import { Hidden } from '../lib/Hidden'
import { SpecList } from '../SpecList'
import { makeSpecHierarchy } from '../SpecList/make-spec-hierarchy'
import { SearchSpec } from '../SearchSpec'

// Cypress.ConfigOptions only appears to have internal options.
// TODO: figure out where the "source of truth" should be for
// an internal options interface.
export interface ExtendedConfigOptions extends Cypress.ConfigOptions {
  projectName: string
}

interface AppProps {
  state: State;
  // eslint-disable-next-line
  eventManager: typeof EventManager
  config: ExtendedConfigOptions
}

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const margin = 32
    const windowSize = useWindowSize()
    const pluginRootContainer = React.useRef<null | HTMLDivElement>(null)

    const { state, eventManager, config } = props

    const [pluginsHeight, setPluginsHeight] = React.useState(500)
    const [isResizing, setIsResizing] = React.useState(false)
    const [containerRef, setContainerRef] = React.useState<HTMLDivElement | null>(null)

    // the viewport + padding left and right or fallback to default size
    const defaultIframeWidth = config.viewportWidth ? config.viewportWidth + margin : 500

    React.useEffect(() => {
      if (pluginRootContainer.current) {
        state.initializePlugins(config, pluginRootContainer.current)
      }
    }, [])
    const hierarchy = makeSpecHierarchy(state.filteredSpecs)

    return (
      <>
        <SplitPane
          split="vertical"
          primary="second"
          minSize={100}
          // calculate maxSize of IFRAMES preview to not cover specs list and command log
          maxSize={windowSize.width - 400}
          defaultSize={defaultIframeWidth}
          onDragStarted={() => setIsResizing(true)}
          onDragFinished={() => setIsResizing(false)}
          className={cs('reporter-pane', { 'is-reporter-resizing': isResizing })}
        >
          <SplitPane
            primary="second"
            split="vertical"
            defaultSize={(windowSize.width - defaultIframeWidth) / 100 * 70}
            minSize={200}
          >
            <div>
              <SearchSpec
                value={props.state.specSearchText}
                onSearch={query => props.state.setSearchSpecText(query)}
              />

              <SpecList
                hierarchy={hierarchy}
                selectedSpecs={state.spec ? [state.spec.absolute] : []}
                onSelectSpec={spec => state.setSingleSpec(spec)}
              />
            </div>

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

          <SplitPane
            primary="second"
            split="horizontal"
            onChange={setPluginsHeight}
            allowResize={state.isAnyDevtoolsPluginOpen}
            onDragStarted={() => setIsResizing(true)}
            onDragFinished={() => setIsResizing(false)}
            size={
              state.isAnyDevtoolsPluginOpen
                ? pluginsHeight
                // show the small not resize-able panel with buttons or nothing
                : state.isAnyPluginToShow ? 30 : 0
            }
          >
            <div className="runner runner-ct container">
              <Header {...props} />
              <Iframes {...props} />
              <Message state={state} />
            </div>

            <Hidden type="layout" hidden={!state.isAnyPluginToShow} className="ct-plugins">
              <div className="ct-plugins-header">
                {state.plugins.map((plugin) => (
                  <button
                    key={plugin.name}
                    onClick={() => state.openDevtoolsPlugin(plugin)}
                    className={cs('ct-plugin-toggle-button', {
                      'ct-plugin-toggle-button-selected': state.activePlugin === plugin.name,
                    })}
                  >
                    {plugin.name}
                  </button>
                ))}

                <button
                  onClick={state.toggleDevtoolsPlugin}
                  className={cs('ct-toggle-plugins-section-button ', {
                    'ct-toggle-plugins-section-button-open': state.isAnyDevtoolsPluginOpen,
                  })}
                >
                  <i className="fas fa-chevron-up" />
                </button>
              </div>

              <Hidden
                type="layout"
                ref={pluginRootContainer}
                className="ct-devtools-container"
                // deal with jumps when inspecting element
                hidden={!state.isAnyDevtoolsPluginOpen}
                style={{ height: pluginsHeight - 30 }}
              />
            </Hidden>
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
} as any // it is much easier to avoid types for prop-types using as any at the end

export default App
