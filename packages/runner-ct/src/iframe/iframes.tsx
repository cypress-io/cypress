import cs from 'classnames'
import { action, when, autorun } from 'mobx'
import React, { useRef, useEffect } from 'react'
import $Cypress from '@packages/driver'
import {
  SnapshotControls,
  ScriptError,
  namedObserver,
  IframeModel,
  selectorPlaygroundModel,
  AutIframe,
  eventManager as EventManager,
} from '@packages/runner-shared'

import State from '../../src/lib/state'
import styles from '../app/RunnerCt.module.scss'
import './iframes.scss'

export function getSpecUrl ({ namespace, spec }, prefix = '') {
  return spec ? `${prefix}/${namespace}/iframes/${spec.absolute}` : ''
}

interface IFramesProps {
  state: State
  eventManager: typeof EventManager
  config: Cypress.RuntimeConfigOptions
}

let autIframe: AutIframe
let $autIframe: JQuery<HTMLIFrameElement>

export const Iframes = namedObserver('Iframes', ({
  config,
  state,
  eventManager,
}: IFramesProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const _toggleSnapshotHighlights = (snapshotProps) => {
    state.setShowSnapshotHighlight(!state.snapshot.showingHighlights)

    if (state.snapshot.showingHighlights) {
      const snapshot = snapshotProps.snapshots[state.snapshot.stateIndex]

      autIframe.highlightEl(snapshot, snapshotProps)
    } else {
      autIframe.removeHighlights()
    }
  }

  const _changeSnapshotState = (snapshotProps, index) => {
    const snapshot = snapshotProps.snapshots[index]

    state.setSnapshotIndex(index)
    autIframe.restoreDom(snapshot)

    if (state.snapshot.showingHighlights && snapshotProps.$el) {
      autIframe.highlightEl(snapshot, snapshotProps)
    } else {
      autIframe.removeHighlights()
    }
  }

  const _setScriptError = action((err: string | undefined) => {
    state.scriptError = err
  })

  const _run = (spec, config) => {
    config.spec = spec

    _setScriptError(undefined)

    eventManager.setup(config)

    // This is extremely required to not run test till devtools registered
    when(() => state.readyToRunTests, () => {
      window.Cypress.on('window:before:load', state.registerDevtools)

      _loadIframes(spec)

      eventManager.initialize($autIframe, config)
    })
  }

  // jQuery is a better fit for managing these iframes, since they need to get
  // wiped out and reset on re-runs and the snapshots are from dom we don't control
  const _loadIframes = (spec: Cypress.Cypress['spec']): JQuery<HTMLIFrameElement> => {
    if (containerRef.current === null) {
      return
    }

    const specSrc = getSpecUrl({ namespace: config.namespace, spec })
    // const $container = $Cypress.$(containerRef.current).empty()
    // const $autIframe: JQuery<HTMLIFrameElement> = autIframe.create().appendTo($container)

    autIframe.showInitialBlankContents()

    // In mount mode we need to render something right from spec file
    // So load application tests to the aut frame
    $autIframe.prop('src', specSrc)

    return $autIframe
  }

  useEffect(() => {
    const $container = $Cypress.$(containerRef.current)

    autIframe = new AutIframe(config)
    $autIframe = autIframe.create()
    $autIframe.appendTo($container)

    eventManager.on('visit:failed', autIframe.showVisitFailure)
    eventManager.on('before:screenshot', autIframe.beforeScreenshot)
    eventManager.on('after:screenshot', autIframe.afterScreenshot)
    eventManager.on('script:error', _setScriptError)

    // TODO: need to take headless mode into account
    // may need to not display reporter if more than 200 tests
    eventManager.on('restart', () => {
      _run(state.spec, config)
    })

    eventManager.on('print:selector:elements:to:console', autIframe.printSelectorElementsToConsole)

    const disposers = [
      autorun(() => {
        autIframe.toggleSelectorPlayground(selectorPlaygroundModel.isEnabled)
      }),
      autorun(() => {
        autIframe.toggleSelectorHighlight(selectorPlaygroundModel.isShowingHighlight)
      }),
    ]

    eventManager.start(config)

    const iframeModel = new IframeModel({
      state,
      restoreDom: autIframe.restoreDom,
      highlightEl: autIframe.highlightEl,
      detachDom: autIframe.detachDom,
      snapshotControls: (snapshotProps) => (
        <SnapshotControls
          eventManager={eventManager}
          snapshotProps={snapshotProps}
          state={state}
          onToggleHighlights={_toggleSnapshotHighlights}
          onStateChange={_changeSnapshotState}
        />
      ),
    })

    iframeModel.listen()
    _run(state.spec, config)

    return () => {
      eventManager.notifyRunningSpec(null)
      eventManager.stop()
      disposers.forEach((dispose) => {
        dispose()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false

      return
    }

    state.callbackAfterUpdate?.()
  })

  const { height, width, scriptError, scale, screenshotting } = state

  return (
    <div
      style={{
        display: state.screenshotting ? 'inherit' : 'grid',
      }}
      className={cs('iframes-ct-container', {
        'has-error': !!scriptError,
        'iframes-ct-container-screenshotting': screenshotting,
      })}
    >
      <div
        ref={containerRef}
        className={
          cs('size-container', {
            [styles.noSpecAut]: !state.spec,
          })
        }
        style={{
          height,
          width,
          transform: `scale(${screenshotting ? 1 : scale})`,
        }}
      />
      <ScriptError error={scriptError} />
      <div className='cover' />
    </div>
  )
})
