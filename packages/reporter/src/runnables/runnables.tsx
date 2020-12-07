import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import { RunnablesError, RunnablesErrorModel } from './runnable-error'
import Runnable from './runnable-and-suite'
import RunnableHeader from './runnable-header'
import { RunnablesStore, RunnableArray } from './runnables-store'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'
import Studio from '../studio/studio'

const noTestsError = (specPath: string) => ({
  title: 'No tests found in your file:',
  link: 'https://on.cypress.io/no-tests-found-in-your-file',
  callout: specPath,
  message: 'We could not detect any tests in the above file. Write some tests and re-run.',
})

const Loading = () => (
  <div className='runnable-loading'>
    <div className='runnable-loading-animation'>
      <div /><div /><div /><div /><div />
    </div>
    <div className='runnable-loading-title'>Your tests are loading...</div>
  </div>
)

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

interface RunnablesContentProps {
  appState?: AppState
  runnablesStore: RunnablesStore
  specPath: string
  error?: RunnablesErrorModel
}

const RunnablesContent = observer(({ appState, runnablesStore, specPath, error }: RunnablesContentProps) => {
  const { isReady, runnables } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  if (appState && appState.extendingTest) {
    return <Studio model={runnablesStore.testById(appState.extendingTest)} />
  }

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnablesStore.runnables.length) {
    error = noTestsError(specPath)
  }

  return error ? <RunnablesError error={error} /> : <RunnablesList runnables={runnables} />
})

interface RunnablesProps {
  error?: RunnablesErrorModel
  runnablesStore: RunnablesStore
  spec: Cypress.Cypress['spec']
  scroller: Scroller
  appState?: AppState
}

@observer
class Runnables extends Component<RunnablesProps> {
  render () {
    const { appState, error, runnablesStore, spec } = this.props

    return (
      <div ref='container' className='container'>
        <RunnableHeader spec={spec} />
        <RunnablesContent
          appState={appState}
          runnablesStore={runnablesStore}
          specPath={spec.relative}
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
