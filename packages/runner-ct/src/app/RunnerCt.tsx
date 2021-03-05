import cs from 'classnames'
import { observer } from 'mobx-react'
import * as React from 'react'

import State from '../lib/state'

import SplitPane from 'react-split-pane'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import EventManager from '../lib/event-manager'
import { Hidden } from '../lib/Hidden'
import { SpecList } from '../SpecList'
import { useWindowSize } from '../lib/useWindowSize'
import { useGlobalHotKey } from '../lib/useHotKey'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { LeftNavMenu } from './LeftNavMenu'
import styles from './RunnerCt.module.scss'

import './RunnerCt.scss'
import { KeyboardHelper, NoSpecSelected } from './NoSpecSelected'
import { useScreenshotHandler } from './useScreenshotHandler'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { ReporterContainer } from './ReporterContainer'
import { Plugins } from './Plugins'

library.add(fas)
library.add(fab)
library.add(far)

interface AppProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
}

export const PLUGIN_BAR_HEIGHT = 40

const DEFAULT_LEFT_SIDE_OF_SPLITPANE_WIDTH = 355
// needs to account for the left bar + the margins around the viewport
const VIEWPORT_SIDE_MARGIN = 40 + 17

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const splitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)
    const appSplitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)
    const pluginRootContainer = React.useRef<null | HTMLDivElement>(null)

    const { state, eventManager, config } = props
    const isOpenMode = !config.isTextTerminal

    const [pluginsHeight, setPluginsHeight] = React.useState(500)
    const [isResizing, setIsResizing] = React.useState(false)

    const [isSpecsListOpen, setIsSpecsListOpen] = React.useState(isOpenMode)

    const [drawerWidth, setDrawerWidth] = React.useState(300)
    const windowSize = useWindowSize()
    const [leftSideOfSplitPaneWidth, setLeftSideOfSplitPaneWidth] = React.useState(DEFAULT_LEFT_SIDE_OF_SPLITPANE_WIDTH)
    const [activeIndex, setActiveIndex] = React.useState<number>(0)
    const headerRef = React.useRef(null)

    const runSpec = (spec: Cypress.Cypress['spec']) => {
      setActiveIndex(0)
      state.setSingleSpec(spec)
    }

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

    useScreenshotHandler({
      state,
      eventManager,
      splitPaneRef,
    })

    function toggleSpecsList () {
      setActiveIndex((isOpenNow) => isOpenNow === 0 ? undefined : 0)
    }

    function focusSpecsList () {
      setActiveIndex(0)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    }

    useGlobalHotKey('ctrl+b,command+b', toggleSpecsList)
    useGlobalHotKey('/', focusSpecsList)

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
        <main className={cs('app-ct', styles.app)}>
          <LeftNavMenu
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
          <SplitPane
            split="vertical"
            primary="first"
            // @ts-expect-error split-pane ref types are weak so we are using our custom type for ref
            ref={appSplitPaneRef}
            minSize={state.screenshotting ? 0 : 200}
            // calculate maxSize of IFRAMES preview to not cover specs list and command log
            maxSize={state.screenshotting ? 0 : windowSize.width / 100 * 80}
            defaultSize={state.screenshotting ? 0 : 355}
            onDragStarted={() => setIsResizing(true)}
            onDragFinished={() => setIsResizing(false)}
            onChange={setDrawerWidth}
            style={{ overflow: 'unset', position: 'relative' }}
            pane1Style={{
              display: `${state.screenshotting || activeIndex !== 0 ? 'none' : 'block'}`,
            }}
            resizerStyle={{
              height: '100vh',
              display: `${
                state.screenshotting || activeIndex !== 0 ? 'none' : 'flex'
              }`,
            }}
            className={cs(styles.appSplitPane, { 'is-reporter-resizing': isResizing })}
          >
            <SpecList
              specs={state.specs}
              inputRef={searchRef}
              selectedSpecs={state.spec ? [state.spec.absolute] : []}
              className={cs(styles.specsList, {
                'display-none': state.screenshotting || activeIndex !== 0 || !isOpenMode,
              })}
              onSelectSpec={runSpec}
            />
          </SplitPane>

          <div className={cs(styles.appWrapper, {
            [styles.appWrapperScreenshotting]: state.screenshotting,
          })}>
            <SplitPane
              split="vertical"
              primary="first"
              // @ts-expect-error split-pane ref types are weak so we are using our custom type for ref
              ref={splitPaneRef}
              minSize={state.screenshotting || !state.spec ? 0 : 100}
              // calculate maxSize of IFRAMES preview to not cover specs list and command log
              maxSize={state.screenshotting || !state.spec ? 0 : 800}
              defaultSize={state.screenshotting || !state.spec ? 0 : 300}
              onDragStarted={() => setIsResizing(true)}
              onDragFinished={() => setIsResizing(false)}
              onChange={onSplitPaneChange}
              style={{ overflow: 'unset' }}
              className={cs('reporter-pane', { 'is-reporter-resizing': isResizing })}
            >
              <div style={{ height: '100%' }}>
                <ReporterContainer
                  state={props.state}
                  config={props.config}
                  eventManager={props.eventManager}
                />
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
                  : state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0
              }
            >
              <div className={cs('runner', styles.runnerCt, styles.container, styles.runner, { [styles.screenshotting]: state.screenshotting, [styles.noSpecAut]: !state.spec })}>
                <Header {...props} ref={headerRef} />
                {!state.spec ? (
                  <NoSpecSelected onSelectSpecRequest={focusSpecsList}>
                    <KeyboardHelper />
                  </NoSpecSelected>
                ) : (
                  <Iframes {...props} />
                )}
                <Message state={state} />
              </div>

              <Plugins
                state={props.state}
                pluginsHeight={pluginsHeight}
                pluginRootContainer={pluginRootContainer}
              />

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
