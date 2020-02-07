import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import AnError, { Error } from '../errors/an-error'
import Runnable from './runnable-and-suite'
import { RunnablesStore } from './runnables-store'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'

const noTestsError = (specPath: string) => ({
  title: 'No tests found in your file:',
  link: 'https://on.cypress.io/no-tests-found-in-your-file',
  callout: specPath,
  message: 'We could not detect any tests in the above file. Write some tests and re-run.',
})

interface Props {
  runnablesStore: RunnablesStore
}

const RunnablesList = observer(({ runnablesStore }: Props) => {
  const filter = runnablesStore.activeFilter

  if (filter && runnablesStore.noneMatchFilter) {
    return (
      <div className='filter-empty-message'>
        <p>No tests match the filter "{filter === 'active' ? 'Running' : _.startCase(filter)}"</p>
      </div>
    )
  }

  return (
    <div className='wrap'>
      <ul className='runnables'>
        {_.map(runnablesStore.runnables, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
      </ul>
    </div>
  )
})

function content (runnablesStore: RunnablesStore, specPath: string, error?: Error) {
  const { isReady, runnables } = runnablesStore

  if (!isReady) return null

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnables.length) {
    error = noTestsError(specPath)
  }

  return error ? <AnError error={error} /> : <RunnablesList runnablesStore={runnablesStore} />
}

interface RunnablesProps {
  error?: Error
  runnablesStore: RunnablesStore
  specPath: string
  scroller: Scroller
  appState?: AppState
}

@observer
class Runnables extends Component<RunnablesProps> {
  render () {
    const { error, runnablesStore, specPath } = this.props

    return (
      <div ref='container' className='container'>
        {content(runnablesStore, specPath, error)}
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
