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
import { debounce } from '../lib/debounce'
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

      window.addEventListener('resize', debounce(onWindowResize))
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
      if (config.isTextTerminal) {
        state.setIsSpecsListOpen(false)
      }
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
        _index: 0,
        icon: 'copy',
        interaction: {
          type: 'js',
          onClick: ({ index }) => {
            onNavItemClick(index)
            const isOpen = !props.state.isSpecsListOpen

            state.setIsSpecsListOpen(isOpen)
            props.eventManager.saveState({ ctIsSpecsListOpen: isOpen })
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
          onClick: ({ event, index }) => {
            if (!event.currentTarget || !event.currentTarget.href) {
              return
            }

            event.preventDefault()
            props.eventManager.reporterBus.emit('external:open', event.currentTarget.href)
          },
        },
      },
    ]

    function toggleSpecsList () {
      setActiveIndex((val) => val === 0 ? undefined : 0)
      const newVal = !props.state.isSpecsListOpen

      state.setIsSpecsListOpen(newVal)
      props.eventManager.saveState({ ctIsSpecsListOpen: newVal })
    }

    function focusSpecsList () {
      setActiveIndex(0)
      state.setIsSpecsListOpen(true)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    }

    useGlobalHotKey('ctrl+b,command+b', () => toggleSpecsList())
    useGlobalHotKey('/', focusSpecsList)

    function onReporterSplitPaneChange (newWidth: number) {
      props.eventManager.saveState({ ctReporterWidth: newWidth })
      state.updateReporterWidth(newWidth)
    }

    function onPluginsSplitPaneChange (newHeight: number) {
      props.eventManager.saveState({ ctPluginsHeight: newHeight })
      state.updatePluginsHeight(newHeight)
    }

    function onSpecListPaneChange (newWidth: number) {
      props.eventManager.saveState({ ctSpecListWidth: newWidth })
      state.updateSpecListWidth(newWidth)
    }

    function hideIfScreenshotting (callback: () => number) {
      if (state.screenshotting) {
        return 0
      }

      return callback()
    }

    function hideReporterIfNecessary (callback: () => number) {
      if (state.screenshotting || !state.spec) {
        return 0
      }

      return callback()
    }

    function hideSpecsListIfNecessary () {
      if (state.screenshotting || !props.state.isSpecsListOpen) {
        return true
      }

      return false
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

    const MainAreaComponent: React.FC = (innerProps) => {
      if (props.state.spec) {
        return (
          <SplitPane
            split="vertical"
            minSize={hideReporterIfNecessary(() => 100)}
            maxSize={hideReporterIfNecessary(() => 600)}
            defaultSize={hideReporterIfNecessary(() => state.reporterWidth)}
            className="primary"
            onChange={debounce(onReporterSplitPaneChange)}
          >
            {innerProps.children}
          </SplitPane>
        )
      }

      return <div>{innerProps.children}</div>
    }

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
          minSize={hideIfScreenshotting(() => state.isSpecsListOpen ? 30 : 0)}
          maxSize={hideIfScreenshotting(() => state.isSpecsListOpen ? 600 : 0)}
          defaultSize={hideIfScreenshotting(() => state.isSpecsListOpen ? state.specListWidth : 0)}
          className="primary"
          // @ts-expect-error split-pane ref types are weak so we are using our custom type for ref
          ref={splitPaneRef}
          onChange={debounce(onSpecListPaneChange)}

        >
          <SpecList
            specs={state.specs}
            inputRef={searchRef}
            selectedSpecs={state.spec ? [state.spec.absolute] : []}
            className={
              cs(styles.specsList, {
                'display-none': hideSpecsListIfNecessary(),
              })
            }
            onSelectSpec={runSpec}
          />

          {/* <SplitPane
            split="vertical"
            minSize={hideReporterIfNecessary(() => 100)}
            maxSize={hideReporterIfNecessary(() => 600)}
            defaultSize={hideReporterIfNecessary(() => state.reporterWidth)}
            className="primary"
            onChange={debounce(onReporterSplitPaneChange)}
          > */}
          <MainAreaComponent>
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
                  ? state.pluginsHeight
                  // show the small not resize-able panel with buttons or nothing
                  : state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0)}
              onChange={debounce(onPluginsSplitPaneChange)}
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
            {/* </SplitPane> */}
          </MainAreaComponent>
        </SplitPane>

      </SplitPane>
    )
  },
)

export default App
