import cs from 'classnames'
import * as React from 'react'
import SplitPane from 'react-split-pane'
import { Message, namedObserver, EventManager, Header } from '@packages/runner-shared'

import { Iframes } from '../iframe/iframes'
import { animationFrameDebounce } from '../lib/debounce'
import { KeyboardHelper } from './KeyboardHelper'
import { NoSpec } from './NoSpec'
import { Plugins } from './Plugins'
import { ReporterContainer } from './ReporterContainer'
import { PLUGIN_BAR_HEIGHT } from './RunnerCt'
import State from '../lib/state'
import { hideIfScreenshotting, hideReporterIfNecessary } from '../lib/hideGuard'

import styles from './RunnerCt.module.scss'

interface SpecContentProps {
  state: State
  eventManager: EventManager
  config: {
    configFile: string
    [key: string]: unknown
  }
}

interface SpecContentWrapperProps {
  state: State
  eventManager: EventManager
  onSplitPaneChange: (newSize: number) => void
}

export const SpecContent = namedObserver('SpecContent', (props: SpecContentProps) => {
  function updatePluginsHeight (height: number) {
    props.state.updatePluginsHeight(height)
  }

  return (
    <SpecContentWrapper state={props.state} eventManager={props.eventManager} onSplitPaneChange={props.state.updateReporterWidth}>
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
        onChange={animationFrameDebounce(updatePluginsHeight)}
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
          <Header {...props} runner='component' />
          {props.state.spec
            ? <Iframes {...props} />
            : (
              <NoSpec>
                <KeyboardHelper />
              </NoSpec>
            )}
          <Message
            state={{
              messageTitle: props.state.messageTitle,
              messageControls: props.state.messageControls,
              messageDescription: props.state.messageDescription,
              messageType: props.state.messageType,
              messageStyles: {
                state: props.state.messageStyles.state,
                styles: props.state.messageStyles.styles,
                messageType: props.state.messageType,
              },
            }}
          />
        </div>
        <Plugins
          key="plugins"
          state={props.state}
          pluginsHeight={hideIfScreenshotting(props.state, () => props.state.pluginsHeight)}
        />
      </SplitPane>
    </SpecContentWrapper>
  )
})

const SpecContentWrapper = namedObserver('SpecContentWrapper', (props: React.PropsWithChildren<SpecContentWrapperProps>) => {
  const updateReporterWidth = (width: number) => {
    props.state.updateReporterWidth(width)
  }

  if (props.state.spec) {
    return (
      <SplitPane
        split='vertical'
        minSize={hideReporterIfNecessary(props.state, () => 100)}
        maxSize={hideReporterIfNecessary(props.state, () => 600)}
        defaultSize={hideReporterIfNecessary(props.state, () => props.state.reporterWidth)}
        className='primary'
        onChange={animationFrameDebounce(updateReporterWidth)}
      >
        {props.children}
      </SplitPane>
    )
  }

  return (
    <div>
      {props.children}
    </div>
  )
})
