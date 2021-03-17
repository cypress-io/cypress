import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, MouseEvent } from 'react'

import events, { Events } from '../lib/events'
import { RunnablesError, RunnablesErrorModel } from './runnable-error'
import Runnable from './runnable-and-suite'
import RunnableHeader from './runnable-header'
import { RunnablesStore, RunnableArray } from './runnables-store'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'
import FileOpener from '../lib/file-opener'

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
}

const RunnablesEmptyState = ({ spec, eventManager = events }: RunnablesEmptyStateProps) => {
  const _launchStudio = (e: MouseEvent) => {
    e.preventDefault()

    // root runnable always has r1 as id
    eventManager.emit('studio:init:suite', 'r1')
  }

  const isAllSpecs = spec.absolute === '__all' || spec.relative === '__all'

  return (
    <div className='no-tests'>
      <h2>
        <i className='fas fa-exclamation-triangle' /> No tests found.
      </h2>
      <p>Cypress could not detect tests in this file.</p>
      { !isAllSpecs && (
        <>
          <FileOpener fileDetails={{
            column: 0,
            line: 0,
            originalFile: spec.relative,
            relativeFile: spec.relative,
            absoluteFile: spec.absolute,
          }}>
            <h3><i className='fas fa-external-link-alt' /> Open file in IDE</h3>
          </FileOpener>
          <p className='text-muted'>Write a test using your preferred text editor.</p>
          <a className='open-studio' onClick={_launchStudio}><h3><i className='fas fa-magic' /> Create test with Cypress Studio</h3></a>
          <p className='open-studio-desc text-muted'>Use an interactive tool to author a test right here.</p>
        </>
      )}
      <hr />
      <p>Need help? Learn how to <a className='help-link' href='https://on.cypress.io/intro' target='_blank'>test your application</a> with Cypress</p>
    </div>
  )
}

interface RunnablesListProps {
  runnables: RunnableArray
}

const RunnablesList = observer(({ runnables }: RunnablesListProps) => (
  <div className='wrap'>
    <ul className='runnables'>
      {_.map(runnables, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
    </ul>
  </div>
))

export interface RunnablesContentProps {
  runnablesStore: RunnablesStore
  spec: Cypress.Cypress['spec']
  error?: RunnablesErrorModel
}

const RunnablesContent = observer(({ runnablesStore, spec, error }: RunnablesContentProps) => {
  const { isReady, runnables, runnablesHistory } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnablesStore.runnables.length) {
    return <RunnablesEmptyState spec={spec} />
  }

  if (error) {
    return <RunnablesError error={error} />
  }

  const specPath = spec.relative

  const isRunning = specPath === runnablesStore.runningSpec

  return <RunnablesList runnables={isRunning ? runnables : runnablesHistory[specPath]} />
})

export interface RunnablesProps {
  error?: RunnablesErrorModel
  runnablesStore: RunnablesStore
  spec: Cypress.Cypress['spec']
  scroller: Scroller
  appState?: AppState
}

@observer
class Runnables extends Component<RunnablesProps> {
  render () {
    const { error, runnablesStore, spec } = this.props

    return (
      <div ref='container' className='container'>
        <RunnableHeader spec={spec} />
        <RunnablesContent
          runnablesStore={runnablesStore}
          spec={spec}
          error={error}
        />
      </div>
    )
  }

  componentDidMount () {
    const { scroller, appState } = this.props

    scroller.setContainer(this.refs.container as Element, action('user:scroll:detected', () => {
      if (appState && appState.isRunning) {
        appState.temporarilySetAutoScrolling(false)
      }
    }))
  }
}

export { RunnablesList }

export default Runnables
