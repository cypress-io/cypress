import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import AnError from '../errors/an-error'
import Runnable from './runnable-and-suite'

const noTestsError = (specPath) => ({
  title: 'No tests found in your file:',
  link: 'https://on.cypress.io/no-tests-found-in-your-file',
  callout: specPath,
  message: 'We could not detect any tests in the above file. Write some tests and re-run.',
})

const RunnablesList = observer(({ runnables }) => (
  <div className='wrap'>
    <ul className='runnables'>
      {_.map(runnables, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
    </ul>
  </div>
))

function content ({ isReady, runnables }, specPath, error) {
  if (!isReady) return null

  // show error if there are no tests, but only if there
  // there isn't an error passed down that supercedes it
  if (!error && !runnables.length) {
    error = noTestsError(specPath)
  }

  return error ? <AnError error={error} /> : <RunnablesList runnables={runnables} />
}

@observer
class Runnables extends Component {
  render () {
    const { error, runnablesStore, specPath } = this.props

    return (
      <div ref='container' className='container'>
        {content(runnablesStore, specPath, error)}
      </div>
    )
  }

  componentDidMount () {
    this.props.scroller.setContainer(this.refs.container, action('user:scroll:detected', () => {
      if (this.props.appState.isRunning) {
        this.props.appState.temporarilySetAutoScrolling(false)
      }
    }))
  }
}

export { RunnablesList }

export default Runnables
