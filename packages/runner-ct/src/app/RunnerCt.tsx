import cs from 'classnames'
import { observer } from 'mobx-react'
import * as React from 'react'
import { useScreenshotHandler } from './useScreenshotHandler'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { ReporterContainer } from './ReporterContainer'
import { NavItem } from '@cypress/design-system'
import SplitPane from 'react-split-pane'

import State from '../lib/state'
import Header from '../header/header'
import Iframes from '../iframe/iframes'
import Message from '../message/message'
import EventManager from '../lib/event-manager'
import { SpecList } from '../SpecList'
import { useWindowSize } from '../lib/useWindowSize'
import { useGlobalHotKey } from '../lib/useHotKey'
import { LeftNavMenu } from './LeftNavMenu'
import styles from './RunnerCt.module.scss'
import { Plugins } from './Plugins'
import './RunnerCt.scss'

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
const VIEWPORT_SIDE_MARGIN = 48 + 17
const DEFAULT_LIST_WIDTH = 300

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const splitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)
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
        console.log(leftSideOfSplitPaneWidth, VIEWPORT_SIDE_MARGIN)
        console.log('windowWidth', window.innerWidth)
        state.updateWindowDimensions({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          reporterWidth: leftSideOfSplitPaneWidth + DEFAULT_LIST_WIDTH + VIEWPORT_SIDE_MARGIN,
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
    }, [])

    React.useEffect(() => {
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
    ]

    if (props.state.plugins.length) {
      items.push(
        {
          id: 'react-devtools-nav',
          title: 'React Devtools',
          icon: ['fab', 'react'],
          itemClasses: styles.largerIcon,
          interaction: {
            type: 'js',
            onClick: () => {
              onNavItemClick(1)
              alert('TODO: Vadidate correct behavior!')

              // if (props.state.activePlugin) {
              //   return props.state.openDevtoolsPlugin(props.state.plugins[0])
              // }

              // props.state.openDevtoolsPlugin(props.state.plugins[0])
            },
          },
        },
      )
    }

    items.push(
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
    )

    function toggleSpecsList () {
      setActiveIndex((val) => val === 0 ? undefined : 0)
      setIsSpecsListOpen((val) => !val)
    }

    function focusSpecsList () {
      setActiveIndex(0)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    }

    useGlobalHotKey('ctrl+b,command+b', () => toggleSpecsList())
    useGlobalHotKey('/', focusSpecsList)

    // TODO: Need to remember what this does...
    function onSplitPaneChange (newWidth: number) {
      setLeftSideOfSplitPaneWidth(newWidth)
      state.updateWindowDimensions({
        reporterWidth: newWidth + VIEWPORT_SIDE_MARGIN,
        windowWidth: null,
        windowHeight: null,
        headerHeight: null,
      })
    }

    function hideIfScreenshotting (callback: () => number) {
      if (state.screenshotting) {
        return 0
      }

      return callback()
    }

    return (
      <SplitPane
        split="vertical"
        allowResize={false}
        maxSize={hideIfScreenshotting(() => 50)}
        minSize={hideIfScreenshotting(() => 50)}
        defaultSize={hideIfScreenshotting(() => 50)}
      >
        <LeftNavMenu
          activeIndex={activeIndex}
          items={items}
        />
        <SplitPane
          split="vertical"
          // do not allow resizing of this for now, simplifes calculation for scale of AUT.
          allowResize={false}
          minSize={hideIfScreenshotting(() => isSpecsListOpen ? 30 : 0)}
          maxSize={hideIfScreenshotting(() => isSpecsListOpen ? 300 : 0)}
          defaultSize={hideIfScreenshotting(() => isSpecsListOpen ? DEFAULT_LIST_WIDTH : 0)}
          className="primary"
          // @ts-expect-error split-pane ref types are weak so we are using our custom type for ref
          ref={splitPaneRef}
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
            minSize={hideIfScreenshotting(() => 100)}
            maxSize={hideIfScreenshotting(() => 400)}
            defaultSize={hideIfScreenshotting(() => DEFAULT_LEFT_SIDE_OF_SPLITPANE_WIDTH)}
            className="primary"
            onChange={onSplitPaneChange}
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
              allowResize={props.state.isAnyDevtoolsPluginOpen}
              size={hideIfScreenshotting(() =>
                state.isAnyDevtoolsPluginOpen
                  ? pluginsHeight
                  // show the small not resize-able panel with buttons or nothing
                  : state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0)}
              onChange={setPluginsHeight}
            >
              <div className={cs(
                'runner', 
                 styles.runnerCt, 
                 styles.container, 
                 styles.runner, 
                 { [styles.screenshotting]: state.screenshotting, 
                 [styles.noSpecAut]: !state.spec }
              )}>
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
