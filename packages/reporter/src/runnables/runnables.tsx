import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tree from 'react-virtualized-tree'

import AnError, { Error } from '../errors/an-error'
import Runnable from './runnable-and-suite'
import RunnableHeader from './runnable-header'
import { RunnablesStore, RunnableArray } from './runnables-store'
import { Scroller } from '../lib/scroller'
import { AppState } from '../lib/app-state'

const noTestsError = (specPath: string) => ({
  title: 'No tests found in your file:',
  link: 'https://on.cypress.io/no-tests-found-in-your-file',
  callout: specPath,
  message: 'We could not detect any tests in the above file. Write some tests and re-run.',
})

const Loading = () => (
  <div className="runnable-loading">
    <div className="runnable-loading-animation">
      <div />
      <div />
      <div />
      <div />
      <div />
    </div>
    <div className="runnable-loading-title">Your tests are loading...</div>
  </div>
)

const RunnablesList = observer(({ runnablesStore }: { runnablesStore: RunnablesStore }) => {
  const { runnables, runnableById } = runnablesStore

  console.log(runnables)

  return (
    <div className='wrap'>
      {/* <ul className='runnables'> */}
      <Tree nodes={runnables}>
        {({ style, node }) => console.log(node.id, node) || <Runnable style={style} key={node.id} model={runnableById(node.id)} />}
      </Tree>
      {/* </ul> */}
    </div>
  )
})

function content (runnablesStore: RunnablesStore, specPath: string, error?: Error) {
  const { isReady, runnables } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

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
        {content(runnablesStore, spec.relative, error)}
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
