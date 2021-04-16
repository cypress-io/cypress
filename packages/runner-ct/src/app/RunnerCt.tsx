import cs from 'classnames'
import * as React from 'react'
import { useScreenshotHandler } from './useScreenshotHandler'
import { NavItem } from '@cypress/design-system'
import SplitPane from 'react-split-pane'

// Need to register these once per app. Depending which components are consumed
// from @cypress/design-system, different icons are required.
import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

library.add(fas)
library.add(fab)

import State from '../lib/state'
import EventManager from '../lib/event-manager'
import { useGlobalHotKey } from '../lib/useHotKey'
import { debounce } from '../lib/debounce'
import { LeftNavMenu } from './LeftNavMenu'
import { SpecContent } from './SpecContent'
import { hideIfScreenshotting, hideSpecsListIfNecessary } from '../lib/hideGuard'
import { namedObserver } from '../lib/mobx'
import { SpecList } from './SpecList/SpecList'
import { FileNode } from './SpecList/makeFileHierarchy'
import styles from './RunnerCt.module.scss'
import './RunnerCt.scss'
import { NoSpec } from './NoSpec'

interface RunnerCtProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions
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

const RunnerCt = namedObserver('RunnerCt',
  (props: RunnerCtProps) => {
    const searchRef = React.useRef<HTMLInputElement>(null)
    const splitPaneRef = React.useRef<{ splitPane: HTMLDivElement }>(null)

    const { state, eventManager, config } = props

    const [activeIndex, setActiveIndex] = React.useState<number>(0)

    const runSpec = React.useCallback((file: FileNode) => {
      setActiveIndex(0)
      const selectedSpec = props.state.specs.find((spec) => spec.absolute.includes(file.relative))

      if (!selectedSpec) {
        throw Error(`Could not find spec matching ${file.relative}.`)
      }

      state.setSingleSpec(selectedSpec)
      // eslint-disable-next-line react-hooks/exhaustive-deps
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

    React.useEffect(() => {
      state.initializePlugins(config)
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

    const updateSpecListWidth = (width: number) => {
      state.updateSpecListWidth(width)
    }

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
          onChange={debounce(updateSpecListWidth)}
        >
          {
            state.specs.length < 1 ? (
              <NoSpec message="No specs found">
                <p className={styles.noSpecsDescription}>
                  Create a new spec file in
                  {' '}
                  <span className={styles.folder}>
                    {
                      props.config.componentFolder
                        ? props.config.componentFolder.replace(props.config.projectRoot, '')
                        : 'the component specs folder'
                    }
                  </span>
                  {' '}
                  and it will immediately appear here.
                </p>
              </NoSpec>
            ) : (
              <SpecList
                specs={props.state.specs}
                selectedFile={state.spec ? state.spec.relative : undefined}
                focusSpecList={focusSpecsList}
                searchRef={searchRef}
                className={cs(styles.specsList, {
                  'display-none': hideSpecsListIfNecessary(state),
                })}
                onFileClick={runSpec}
              />
            )
          }

          <SpecContent
            state={props.state}
            eventManager={props.eventManager}
            config={props.config}
          />
        </SplitPane>
      </SplitPane>
    )
  })

export default React.memo(RunnerCt, () => true)
