import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'

import events, { Events } from '../lib/events'
import { RunnablesError, RunnablesErrorModel } from './runnable-error'
import Runnable from './runnable-and-suite'
import RunnableHeader from './runnable-header'
import { RunnablesStore, RunnableArray } from './runnables-store'
import statsStore, { StatsStore } from '../header/stats-store'
import { Scroller } from '../lib/scroller'
import type { AppState } from '../lib/app-state'
import OpenFileInIDE from '../lib/open-file-in-ide'

import OpenIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/technology-code-editor_x16.svg'
import StudioIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'
import WarningIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/warning_x16.svg'

const Loading = () => (
  <div className='runnable-loading'>
    <div className='runnable-loading-animation'>
      <div /><div /><div /><div /><div />
    </div>
    <div className='runnable-loading-title'>Your tests are loading...</div>
  </div>
)

interface RunnablesEmptyStateProps {
  spec: Cypress.Cypress['spec']
  eventManager?: Events
  studioEnabled: boolean
}

const RunnablesEmptyState = ({ spec, studioEnabled, eventManager = events }: RunnablesEmptyStateProps) => {
  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()

    // root runnable always has r1 as id
    eventManager.emit('studio:init:suite', 'r1')
  }

  const isAllSpecs = spec.absolute === '__all' || spec.relative === '__all'

  return (
    <div className='no-tests'>
      <h2>
        <WarningIcon className="warning-icon" />No tests found.
      </h2>
      <p>Cypress could not detect tests in this file.</p>
      { !isAllSpecs && (
        <>
          <OpenFileInIDE fileDetails={{
            column: 0,
            line: 0,
            originalFile: spec.relative,
            relativeFile: spec.relative,
            absoluteFile: spec.absolute,
          }}>
            <a href="#" onClick={(event) => {
              event.preventDefault()
            }}>
              <h3><OpenIcon />Open file in IDE</h3>
            </a>
          </OpenFileInIDE>
          <p className='text-muted'>Write a test using your preferred text editor.</p>
          {studioEnabled && (
            <>
              <a
                data-cy="studio-create-test"
                className='open-studio'
                onClick={_launchStudio}>
                <h3>
                  <StudioIcon /> Create test with Cypress Studio
                </h3>
              </a>
              <p className='text-muted open-studio-desc'>Use an interactive tool to author a test right here.</p>
            </>
          )}
        </>
      )}
      <hr />
      <p>Need help? Learn how to <a className='help-link' href='https://on.cypress.io/intro' target='_blank'>test your application</a> with Cypress</p>
    </div>
  )
}

interface RunnablesListProps {
  runnables: RunnableArray
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const RunnablesList = observer(({ runnables, studioEnabled, canSaveStudioLogs }: RunnablesListProps) => (
  <div className='wrap'>
    <ul className='runnables'>
      {_.map(runnables, (runnable) =>
        (<Runnable
          key={runnable.id}
          model={runnable}
          canSaveStudioLogs={canSaveStudioLogs}
          studioEnabled={studioEnabled}
        />))}
    </ul>
  </div>
))

export interface RunnablesContentProps {
  runnablesStore: RunnablesStore
  spec: Cypress.Cypress['spec']
  error?: RunnablesErrorModel
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

const RunnablesContent = observer(({ runnablesStore, spec, error, studioEnabled, canSaveStudioLogs }: RunnablesContentProps) => {
  const { isReady, runnables, runnablesHistory } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnablesStore.runnables.length) {
    return <RunnablesEmptyState spec={spec} studioEnabled={studioEnabled} />
  }

  if (error) {
    return <RunnablesError error={error} />
  }

  const specPath = spec.relative

  const isRunning = specPath === runnablesStore.runningSpec

  return (
    <RunnablesList
      runnables={isRunning ? runnables : runnablesHistory[specPath]}
      studioEnabled={studioEnabled}
      canSaveStudioLogs={canSaveStudioLogs}
    />
  )
})

export interface RunnablesProps {
  error?: RunnablesErrorModel
  runnablesStore: RunnablesStore
  statsStore: StatsStore
  spec: Cypress.Cypress['spec']
  scroller: Scroller
  appState?: AppState
  studioEnabled: boolean
  canSaveStudioLogs: boolean
}

@observer
class Runnables extends Component<RunnablesProps> {
  render () {
    const { error, runnablesStore, spec, studioEnabled, canSaveStudioLogs } = this.props

    return (
      <div ref='container' className='container'>
        <RunnableHeader spec={spec} statsStore={statsStore} />
        <RunnablesContent
          runnablesStore={runnablesStore}
          studioEnabled={studioEnabled}
          canSaveStudioLogs={canSaveStudioLogs}
          spec={spec}
          error={error}
        />
      </div>
    )
  }

  componentDidMount () {
    const { scroller, appState } = this.props

    const containerEl = this.refs.container as HTMLElement

    if (window.__CYPRESS_MODE__ === 'open') {
      // in open mode, listen for scroll events so that users can pause the command log auto-scroll
      // by manually scrolling the command log
      containerEl.setAttribute('data-cy-scroll-listen', 'true')

      scroller.setContainer(this.refs.container as Element, action('user:scroll:detected', () => {
        if (appState && appState.isRunning) {
          appState.temporarilySetAutoScrolling(false)
        }
      }))
    } else {
      // in run mode, still add the data attribute so the tests have an explicit test locator,
      // but do not do any scroll handling. No user is scrolling in run mode and it can
      // cause problems in video recordings by incorrectly turning off autoscrolling,
      // see issue https://github.com/cypress-io/cypress/issues/16098
      containerEl.setAttribute('data-cy-scroll-listen', 'false')
    }
  }
}

export { RunnablesList }

export default Runnables
