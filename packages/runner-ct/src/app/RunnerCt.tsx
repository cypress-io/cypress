import cs from 'classnames'
import { observer } from 'mobx-react'
import * as React from 'react'
import { Reporter } from '@packages/reporter/src/main'

import errorMessages from '../errors/error-messages'
import State from '../lib/state'

import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import { ReporterHeader } from './ReporterHeader'
import EventManager from '../lib/event-manager'
import { Hidden } from '../lib/Hidden'
import { SpecList } from '../SpecList'
import { ResizableBox } from '../lib/ResizableBox'
import { useWindowSize } from '../lib/useWindowSize'
import { useGlobalHotKey } from '../lib/useHotKey'

import './RunnerCt.scss'

// Cypress.ConfigOptions only appears to have internal options.
// TODO: figure out where the "source of truth" should be for
// an internal options interface.
export interface ExtendedConfigOptions extends Cypress.ConfigOptions {
  projectName: string
}

interface AppProps {
  state: State
  eventManager: typeof EventManager
  config: ExtendedConfigOptions
}

const DEFAULT_LEFT_SIDE_OF_SPLITPANE_WIDTH = 355
// needs to account for the left bar + the margins around the viewport
const VIEWPORT_SIDE_MARGIN = 40 + 17

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const pluginRootContainer = React.useRef<null | HTMLDivElement>(null)

    const { state, eventManager, config } = props

    const [pluginsHeight, setPluginsHeight] = React.useState(500)
    const [isResizing, setIsResizing] = React.useState(false)
    const [isSpecsListOpen, setIsSpecsListOpen] = React.useState(true)
    const [drawerWidth, setDrawerWidth] = React.useState(300)
    const windowSize = useWindowSize()
    const [leftSideOfSplitPaneWidth, setLeftSideOfSplitPaneWidth] = React.useState(DEFAULT_LEFT_SIDE_OF_SPLITPANE_WIDTH)
    const headerRef = React.useRef(null)

    function monitorWindowResize () {
      // I can't use forwardref in class based components
      // Header still is a class component
      // FIXME: use a forwardRef when available
      const header = headerRef.current.headerRef

      function onWindowResize () {
        state.updateWindowDimensions({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          reporterWidth: leftSideOfSplitPaneWidth + VIEWPORT_SIDE_MARGIN,
          headerHeight: header.offsetHeight || 0,
        })
      }

      window.addEventListener('resize', onWindowResize)
      window.dispatchEvent(new Event('resize'))
    }

    React.useEffect(() => {
      if (pluginRootContainer.current) {
        state.initializePlugins(config, pluginRootContainer.current)
      }

      monitorWindowResize()
    }, [])

    useGlobalHotKey('ctrl+b,command+b', () => {
      setIsSpecsListOpen((isOpenNow) => !isOpenNow)
    })

    useGlobalHotKey('/', () => {
      setIsSpecsListOpen(true)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    })

    function onSplitPaneChange (newWidth: number) {
      setLeftSideOfSplitPaneWidth(newWidth)
      state.updateWindowDimensions({
        reporterWidth: newWidth + VIEWPORT_SIDE_MARGIN,
        windowWidth: null,
        windowHeight: null,
        headerHeight: null,
      })
    }

    return (
      <>
        <main className="app-ct">
          <div
            className="specs-list-drawer"
            style={{
              transform: isSpecsListOpen ? `translateX(0)` : `translateX(-${drawerWidth - 20}px)`,
            }}
          >
            <ResizableBox
              disabled={!isSpecsListOpen}
              width={drawerWidth}
              onIsResizingChange={setIsResizing}
              onWidthChange={setDrawerWidth}
              className="specs-list-container"
              data-cy="specs-list-resize-box"
              minWidth={200}
              maxWidth={windowSize.width / 100 * 80} // 80vw
            >
              <nav>
                <a
                  id="menu-toggle"
                  onClick={() => setIsSpecsListOpen(!isSpecsListOpen)}
                  className="menu-toggle"
                  aria-label="Open the menu"
                >
                  <i className="fa fa-bars" aria-hidden="true"/>
                </a>
              </nav>
              <SpecList
                specs={state.specs}
                inputRef={searchRef}
                disableTextSelection={isResizing}
                selectedSpecs={state.spec ? [state.spec.absolute] : []}
                onSelectSpec={(spec) => state.setSingleSpec(spec)}
              />
            </ResizableBox>
          </div>
          <div className="app-wrapper">
            <SplitPane
              split="vertical"
              primary="first"
              minSize={100}
              // calculate maxSize of IFRAMES preview to not cover specs list and command log
              maxSize={400}
              defaultSize={355}
              onDragStarted={() => setIsResizing(true)}
              onDragFinished={() => setIsResizing(false)}
              onChange={onSplitPaneChange}
              className={cs('reporter-pane', { 'is-reporter-resizing': isResizing })}
            >
              <div>
                {state.spec && (
                  <Reporter
                    runMode={state.runMode}
                    runner={eventManager.reporterBus}
                    spec={state.spec}
                    specRunId={state.specRunId}
                    allSpecs={state.multiSpecs}
                    // @ts-ignore
                    error={errorMessages.reporterError(state.scriptError, state.spec.relative)}
                    firefoxGcInterval={config.firefoxGcInterval}
                    resetStatsOnSpecChange={state.runMode === 'single'}
                    renderReporterHeader={(props) => <ReporterHeader {...props} />}
                    experimentalStudioEnabled={false}
                  />
                )}
              </div>
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
                  <Header {...props} ref={headerRef}/>
                  <Iframes {...props} />
                  <Message state={state}/>
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
                      <i className="fas fa-chevron-up"/>
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
          </div>
          {/* these pixels help ensure the browser has painted when taking a screenshot */}
          <div className='screenshot-helper-pixels'>
            <div/>
            <div/>
            <div/>
            <div/>
            <div/>
            <div/>
          </div>
        </main>
      </>
    )
  },
)

export default App
