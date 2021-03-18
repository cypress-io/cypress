import cs from 'classnames'
import { observer } from 'mobx-react'
import * as React from 'react'
import { useScreenshotHandler } from './useScreenshotHandler'
import { NavItem, SpecList, FileNode } from '@cypress/design-system'
import SplitPane from 'react-split-pane'

import State from '../lib/state'
import EventManager from '../lib/event-manager'
import { SearchSpec } from '../SpecList/components/SearchSpec'
import { useGlobalHotKey } from '../lib/useHotKey'
import { debounce } from '../lib/debounce'
import { LeftNavMenu } from './LeftNavMenu'
import styles from './RunnerCt.module.scss'
import './RunnerCt.scss'
import { SpecContent } from './SpecContent'
import { hideIfScreenshotting, hideReporterIfNecessary, hideSpecsListIfNecessary } from '../lib/hideGuard'

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
  (props: AppProps) => {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const splitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)
    const pluginRootContainer = React.useRef<null | HTMLDivElement>(null)

    const { state, eventManager, config } = props

    const [activeIndex, setActiveIndex] = React.useState<number>(0)
    const [search, setSearch] = React.useState('')

    const runSpec = React.useCallback((file: FileNode) => {
      setActiveIndex(0)
      state.setSingleSpec(state.specs.find((spec) => spec.absolute.includes(file.absolute)))
    }, [state])

    function monitorWindowResize () {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      monitorWindowResize()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      if (config.isTextTerminal) {
        state.setIsSpecsListOpen(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    useGlobalHotKey('ctrl+b,command+b', toggleSpecsList)
    useGlobalHotKey('/', focusSpecsList)

    function onReporterSplitPaneChange (newWidth: number) {
      state.updateReporterWidth(newWidth)
    }

    function persistWidth (prop: 'ctReporterWidth' | 'ctSpecListWidth') {
      return (newWidth: number) => {
        props.eventManager.saveState({ [prop]: newWidth })
      }
    }

    const leftNav = state.screenshotting
      ? <span />
      : (
        <LeftNavMenu
          activeIndex={activeIndex}
          items={items}
        />
      )

    const filteredSpecs = props.state.specs.filter((spec) => spec.relative.toLowerCase().includes(search.toLowerCase()))

    return (
      <SplitPane
        split="vertical"
        allowResize={false}
        maxSize={hideIfScreenshotting(state, () => 50)}
        minSize={hideIfScreenshotting(state, () => 50)}
        defaultSize={hideIfScreenshotting(state, () => 50)}
      >
        {leftNav}
        <SplitPane
          ref={splitPaneRef}
          split="vertical"
          minSize={hideIfScreenshotting(state, () => state.isSpecsListOpen ? 30 : 0)}
          maxSize={hideIfScreenshotting(state, () => state.isSpecsListOpen ? 600 : 0)}
          defaultSize={hideIfScreenshotting(state, () => state.isSpecsListOpen ? state.specListWidth : 0)}
          className={cs('primary', { isSpecsListClosed: !state.isSpecsListOpen })}
          pane2Style={{
            borderLeft: '1px solid rgba(230, 232, 234, 1)' /* $metal-20 */,
          }}
          onDragFinished={persistWidth('ctSpecListWidth')}
          onChange={debounce(state.updateSpecListWidth)}
        >
          <SpecList
            specs={filteredSpecs}
            selectedFile={state.spec ? state.spec.relative : undefined}
            className={cs(styles.specsList, {
              'display-none': hideSpecsListIfNecessary(state),
            })}
            searchInput={(
              <SearchSpec
                ref={searchRef}
                value={search}
                onSearch={setSearch}
              />
            )}
            onFileClick={runSpec}
          />
          {props.state.spec
            ? (
              <SplitPane
                split='vertical'
                minSize={hideReporterIfNecessary(state, () => 100)}
                maxSize={hideReporterIfNecessary(state, () => 600)}
                defaultSize={hideReporterIfNecessary(state, () => state.reporterWidth)}
                className='primary'
                onChange={debounce(onReporterSplitPaneChange)}
              >
                <SpecContent state={props.state} eventManager={props.eventManager} config={props.config} pluginRootContainerRef={pluginRootContainer} />
              </SplitPane>
            )
            : (
              <div>
                <SpecContent state={props.state} eventManager={props.eventManager} config={props.config} pluginRootContainerRef={pluginRootContainer} />
              </div>
            )}
        </SplitPane>
      </SplitPane>
    )
  },
)

export default App
