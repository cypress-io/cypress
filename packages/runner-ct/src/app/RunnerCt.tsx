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
import { useGlobalHotKey } from '../lib/useHotKey'
import { LeftNavMenu } from './LeftNavMenu'
import styles from './RunnerCt.module.scss'
import { Plugins } from './Plugins'
import { KeyboardHelper } from './KeyboardHelper'
import './RunnerCt.scss'

library.add(fas)
library.add(fab)
library.add(far)

interface AppProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
}

export const DEFAULT_PLUGINS_HEIGHT = 300

export const PLUGIN_BAR_HEIGHT = 40

export const LEFT_NAV_WIDTH = 48

export const DEFAULT_REPORTER_WIDTH = 355

export const DEFAULT_LIST_WIDTH = 300

export const HEADER_HEIGHT = 40

export const AUT_IFRAME_MARGIN = {
  X: 8,
  Y: 16,
}

const App: React.FC<AppProps> = observer(
  function App (props: AppProps) {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const splitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)
    const pluginRootContainer = React.useRef<null | HTMLDivElement>(null)

    const { state, eventManager, config } = props

    // const windowSize = useWindowSize()
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

    React.useEffect(() => {
      const isOpenMode = !config.isTextTerminal

      state.setIsSpecsListOpen(isOpenMode)
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
            props.state.setIsSpecsListOpen(!props.state.isSpecsListOpen)
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
      setActiveIndex((val) => val === 0 ? undefined : 0)
      props.state.setIsSpecsListOpen(!props.state.isSpecsListOpen)
    }

    function focusSpecsList () {
      setActiveIndex(0)
      props.state.setIsSpecsListOpen(true)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    }

    useGlobalHotKey('ctrl+b,command+b', () => toggleSpecsList())
    useGlobalHotKey('/', focusSpecsList)

    function onReporterSplitPaneChange (newWidth: number) {
      state.updateReporterWidth(newWidth)
    }

    function onPluginsSplitPaneChange (newHeight: number) {
      state.updatePluginsHeight(newHeight)
    }

    function onSpecListPaneChange (newWidth: number) {
      state.updateSpecListWidth(newWidth)
    }

    function hideIfScreenshotting (callback: () => number) {
      if (state.screenshotting) {
        return 0
      }

      return callback()
    }

    const leftNav = state.screenshotting
      ? <span />
      : (
        <LeftNavMenu
          activeIndex={activeIndex}
          items={items}
        />
      )

    const autRunnerContent = state.spec
      ? <Iframes {...props} />
      : (
        <KeyboardHelper />
      )

    return (
      <SplitPane
        split="vertical"
        allowResize={false}
        maxSize={hideIfScreenshotting(() => 50)}
        minSize={hideIfScreenshotting(() => 50)}
        defaultSize={hideIfScreenshotting(() => 50)}
      >
        {leftNav}
        <SplitPane
          split="vertical"
          // do not allow resizing of this for now, simplifes calculation for scale of AUT.
          minSize={hideIfScreenshotting(() => props.state.isSpecsListOpen ? 30 : 0)}
          maxSize={hideIfScreenshotting(() => state.isSpecsListOpen ? 600 : 0)}
          defaultSize={hideIfScreenshotting(() => state.isSpecsListOpen ? DEFAULT_LIST_WIDTH : 0)}
          className="primary"
          // @ts-expect-error split-pane ref types are weak so we are using our custom type for ref
          ref={splitPaneRef}
          onChange={onSpecListPaneChange}

        >
          <SpecList
            specs={state.specs}
            inputRef={searchRef}
            selectedSpecs={state.spec ? [state.spec.absolute] : []}
            className={
              cs(styles.specsList, {
                'display-none': state.screenshotting,
              })
            }
            onSelectSpec={runSpec}
          />

          <SplitPane
            split="vertical"
            minSize={hideIfScreenshotting(() => 100)}
            maxSize={hideIfScreenshotting(() => 600)}
            defaultSize={hideIfScreenshotting(() => DEFAULT_REPORTER_WIDTH)}
            className="primary"
            onChange={onReporterSplitPaneChange}
          >
            <ReporterContainer
              state={props.state}
              config={props.config}
              eventManager={props.eventManager}
            />

            <SplitPane
              split='horizontal'
              primary='second'
              allowResize={props.state.isAnyDevtoolsPluginOpen}
              size={hideIfScreenshotting(() =>
                state.isAnyDevtoolsPluginOpen
                  ? DEFAULT_PLUGINS_HEIGHT
                  // show the small not resize-able panel with buttons or nothing
                  : state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0)}
              onChange={onPluginsSplitPaneChange}
            >
              <div className={cs(
                'runner',
                styles.runnerCt,
                styles.runner,
                {
                  [styles.screenshotting]: state.screenshotting,
                  [styles.noSpecAut]: !state.spec,
                },
              )}>
                <Header {...props} ref={headerRef} />
                {autRunnerContent}
                <Message state={state} />
              </div>

              <Plugins
                state={props.state}
                pluginsHeight={hideIfScreenshotting(() => state.pluginsHeight)}
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
