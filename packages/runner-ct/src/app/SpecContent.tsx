import cs from 'classnames'
import * as React from 'react'
import SplitPane from 'react-split-pane'

import Header from '../header/header'
import Iframes from '../iframe/iframes'
import { debounce } from '../lib/debounce'
import { Message } from '../message/message'
import { KeyboardHelper } from './KeyboardHelper'
import { NoSpecSelected } from './NoSpecSelected'
import { Plugins } from './Plugins'
import { ReporterContainer } from './ReporterContainer'
import { PLUGIN_BAR_HEIGHT } from './RunnerCt'
import State from '../lib/state'
import EventManager from '../lib/event-manager'
import { hideIfScreenshotting, hideReporterIfNecessary } from '../lib/hideGuard'

import styles from './RunnerCt.module.scss'
import { namedObserver } from '../lib/mobx'

interface SpecContentProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
  pluginRootContainerRef: React.MutableRefObject<HTMLDivElement>
}

interface SpecContentWrapperProps {
  state: State
  onSplitPaneChange: (newSize: number) => void
}

export const SpecContent = namedObserver('SpecContent', (props: SpecContentProps) => {
  return (
    <SpecContentWrapper state={props.state} onSplitPaneChange={props.state.updateReporterWidth}>
      <ReporterContainer
        state={props.state}
        config={props.config}
        eventManager={props.eventManager}
      />
      <SplitPane
        split='horizontal'
        primary='second'
        allowResize={props.state.isAnyDevtoolsPluginOpen}
        size={hideIfScreenshotting(props.state, () =>
          props.state.isAnyDevtoolsPluginOpen
            ? props.state.pluginsHeight
          // show the small not resize-able panel with buttons or nothing
            : props.state.isAnyPluginToShow ? PLUGIN_BAR_HEIGHT : 0)}
        onChange={debounce(props.state.updatePluginsHeight)}
      >
        <div className={cs(
          'runner',
          styles.runnerCt,
          styles.runner,
          {
            [styles.screenshotting]: props.state.screenshotting,
            [styles.noSpecAut]: !props.state.spec,
          },
        )}
        >
          <Header {...props} />
          {props.state.spec
            ? <Iframes {...props} />
            : (
              <NoSpecSelected>
                <KeyboardHelper />
              </NoSpecSelected>
            )}
          <Message state={props.state} />
        </div>
        <Plugins
          state={props.state}
          pluginsHeight={hideIfScreenshotting(props.state, () => props.state.pluginsHeight)}
          pluginRootContainerRef={props.pluginRootContainerRef}
        />
      </SplitPane>
    </SpecContentWrapper>
  )
})

const SpecContentWrapper = namedObserver('SpecContentWrapper', (props: React.PropsWithChildren<SpecContentWrapperProps>) => props.state.spec ? (
  <SplitPane
    split='vertical'
    minSize={hideReporterIfNecessary(props.state, () => 100)}
    maxSize={hideReporterIfNecessary(props.state, () => 600)}
    defaultSize={hideReporterIfNecessary(props.state, () => props.state.reporterWidth)}
    className='primary'
    onChange={debounce(props.onSplitPaneChange)}
  >
    {props.children}
  </SplitPane>
) : (
  <div>
    {props.children}
  </div>
))
