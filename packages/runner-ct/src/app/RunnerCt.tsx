import cs from 'classnames'
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
import { SpecContent } from './SpecContent'
import { hideIfScreenshotting, hideSpecsListIfNecessary } from '../lib/hideGuard'
import { namedObserver } from '../lib/mobx'

import styles from './RunnerCt.module.scss'
import './RunnerCt.scss'

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

const buildNavItems = (eventManager: typeof EventManager, toggleIsSetListOpen: () => boolean): NavItem[] => [
  {
    id: 'file-explorer-nav',
    title: 'File Explorer',
    _index: 0,
    icon: 'copy',
    interaction: {
      type: 'js',
      onClick: () => toggleIsSetListOpen(),
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
      onClick: ({ event }) => {
        if (!event.currentTarget?.href) {
          return
        }

        event.preventDefault()
        eventManager.reporterBus.emit('external:open', event.currentTarget.href)
      },
    },
  },
]

const App = namedObserver('RunnerCt',
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

    const toggleIsSpecsListOpen = React.useCallback((override?: boolean) => {
      // Clear selected index on match
      setActiveIndex((prevIndex) => override || prevIndex !== 0 ? 0 : undefined)

      let newVal: boolean

      if (override !== undefined) {
        state.setIsSpecsListOpen(override)
        newVal = override
      } else {
        newVal = state.toggleIsSpecsListOpen()
      }

      props.eventManager.saveState({ ctIsSpecsListOpen: newVal })

      return newVal
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.eventManager])

    const navItems = React.useMemo(() =>
      buildNavItems(props.eventManager, toggleIsSpecsListOpen)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    , [props.eventManager, toggleIsSpecsListOpen])

    const focusSpecsList = React.useCallback(() => {
      toggleIsSpecsListOpen(true)

      // a little trick to focus field on the next tick of event loop
      // to prevent the handled keydown/keyup event to fill input with "/"
      setTimeout(() => {
        searchRef.current?.focus()
      }, 0)
    }, [toggleIsSpecsListOpen])

    useGlobalHotKey('ctrl+b,command+b', toggleIsSpecsListOpen)
    useGlobalHotKey('/', focusSpecsList)

    useScreenshotHandler({
      state,
      eventManager,
      splitPaneRef,
    })

    // Inner function should probably be memoed, but I will avoid it until we see data requiring it
    const persistWidth = (prop: 'ctReporterWidth' | 'ctSpecListWidth') => {
      return (newWidth: number) => {
        props.eventManager.saveState({ [prop]: newWidth })
      }
    }

    const filteredSpecs = props.state.specs.filter((spec) => spec.relative.toLowerCase().includes(search.toLowerCase()))

    React.useLayoutEffect(() => {
      if (config.isTextTerminal) {
        state.setIsSpecsListOpen(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      if (!pluginRootContainer.current) {
        throw new Error('Unreachable branch: pluginRootContainer ref was not set')
      }

      state.initializePlugins(config, pluginRootContainer.current)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
      const onWindowResize = debounce(() =>
        state.updateWindowDimensions({
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        }))

      window.addEventListener('resize', onWindowResize)
      window.dispatchEvent(new Event('resize'))

      return () => window.removeEventListener('resize', onWindowResize)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
      <SplitPane
        split="vertical"
        allowResize={false}
        maxSize={hideIfScreenshotting(state, () => 50)}
        minSize={hideIfScreenshotting(state, () => 50)}
        defaultSize={hideIfScreenshotting(state, () => 50)}
      >
        {state.screenshotting
          ? <span />
          : (
            <LeftNavMenu
              activeIndex={activeIndex}
              items={navItems}
            />
          )}
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
          <SpecContent state={props.state} eventManager={props.eventManager} config={props.config} pluginRootContainerRef={pluginRootContainer} />
        </SplitPane>
      </SplitPane>
    )
  })

export default App
