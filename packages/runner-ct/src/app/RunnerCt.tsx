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
import { useScreenshotHandler } from './useScreenshotHandler'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { ReporterContainer } from './ReporterContainer'
import { Plugins } from './Plugins'
import { NavItem } from '@cypress/design-system/dist/components/LeftNav/types'

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

    const [pluginsHeight, setPluginsHeight] = React.useState(300)
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

    function onNavItemClick (index: number) {
      if (activeIndex !== index) {
        return setActiveIndex(index)
      }

      setActiveIndex(undefined)
    }

    const items: NavItem[] = [
      {
        id: 'file-explorer-nav',
        title: 'File Explorer',
        icon: 'copy',
        interaction: {
          type: 'js',
          onClick: () => {
            onNavItemClick(0)
            setIsSpecsListOpen(!isSpecsListOpen)
          },
        },
      },
      {
        id: 'react-devtools-nav',
        title: 'React Devtools',
        icon: ['fab', 'react'],
        itemClasses: styles.largerIcon,
        interaction: {
          type: 'js',
          onClick: () => {
            onNavItemClick(1)
            // handle devtools icon click
          },
        },
      },
      {
        id: 'docs-nav',
        title: 'Cypress Documentation',
        location: 'bottom',
        icon: 'book',
        interaction: {
          type: 'anchor',
          href: 'https://on.cypress.io/component-testing',
        },
      },
    ]

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
      <SplitPane
        split="vertical"
        allowResize={false}
      >
        <LeftNavMenu
          activeIndex={activeIndex}
          items={items}
        />
        <SplitPane
          split="vertical"
          minSize={isSpecsListOpen ? 30 : 0}
          maxSize={isSpecsListOpen ? 300 : 0}
          defaultSize={isSpecsListOpen ? 300 : 0}
          className="primary"
        >
          <SpecList
            specs={state.specs}
            inputRef={searchRef}
            selectedSpecs={state.spec ? [state.spec.absolute] : []}
            className={cs(styles.specsList, {
              'display-none': state.screenshotting || !isOpenMode,
            })}
            onSelectSpec={runSpec}
          />

          <SplitPane
            split="vertical"
            minSize={100}
            maxSize={400}
            defaultSize={300}
            className="primary"
          >
            <ReporterContainer
              state={props.state}
              config={props.config}
              eventManager={props.eventManager}
              onSelectSpecRequest={() => setIsSpecsListOpen(true)}
            />

            <SplitPane
              split='horizontal'
              primary='second'
              size={
                state.isAnyDevtoolsPluginOpen
                  ? pluginsHeight
                  // show the small not resize-able panel with buttons or nothing
                  : state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0
              }
              onChange={setPluginsHeight}
            >
              <div className={cs('runner', styles.runnerCt, styles.container, styles.runner, { [styles.screenshotting]: state.screenshotting, [styles.noSpecAut]: !state.spec })}>
                <Header {...props} ref={headerRef} />
                <Iframes {...props} />
                <Message state={state} />
              </div>

              <Plugins
                state={props.state}
                pluginsHeight={pluginsHeight}
                pluginRootContainer={pluginRootContainer}
              />
            </SplitPane>
          </SplitPane>
        </SplitPane>

      </SplitPane>
    )
  },
)

export default App
