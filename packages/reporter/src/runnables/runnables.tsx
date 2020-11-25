import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tree from 'react-virtualized-tree'

import { AppState } from '../lib/app-state'
import { RunnablesError, RunnablesErrorModel } from './runnable-error'
import RunnableHeader from './runnable-header'
import { RunnablesStore } from './runnables-store'
import { Scroller } from '../lib/scroller'
import { Virtualizable } from '../tree/virtualizable'

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
  const { runnables, modelById } = runnablesStore

  // console.log('render RunnablesList')
  // console.log('render RunnablesList', toJS(runnables))

  return (
    <div className='runnables'>
      <Tree nodes={runnables} nodeMarginLeft={0} onChange={() => {}}>
        {({ node, index, measure, onChange, style }) => {
          return <Virtualizable key={node.id} model={modelById(node.id)} node={node} index={index} measure={measure} onChange={onChange} style={style} />
        }}
      </Tree>
    </div>
  )
})

interface RunnablesContentProps {
  runnablesStore: RunnablesStore
  specPath: string
  error?: RunnablesErrorModel
}

const RunnableContent = observer(({ runnablesStore, specPath, error }: RunnablesContentProps) => {
  const { isReady, runnables } = runnablesStore

  if (!isReady) {
    return <Loading />
  }

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnables.length) {
    error = noTestsError(specPath)
  }

  return error ? <RunnablesError error={error} /> : <RunnablesList runnablesStore={runnablesStore} />
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
    const { error, runnablesStore, spec } = this.props

    return (
      <div ref='container' className='container'>
        <RunnableHeader spec={spec} />
        <RunnableContent runnablesStore={runnablesStore} specPath={spec.relative} error={error} />
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
