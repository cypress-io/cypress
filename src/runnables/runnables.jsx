import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import scroller from '../lib/scroller'
import Runnable from './runnable-and-suite'

const NoTests = observer(({ specPath }) => (
  <div className='no-tests'>
    <h4>
      <i className='fa fa-warning'></i>
      Sorry, there's something wrong with this file:
      <a
        href='https://on.cypress.io/theres-something-wrong-with-this-file'
        target='_blank'
        rel='noopener noreferrer'
      >
        <i className='fa fa-question-circle'></i>
      </a>
    </h4>
    <pre>{specPath.split('/').join(' / ')}</pre>
    <ul>
      <li>Have you written any tests?</li>
      <li>Are there typo’s or syntax errors?</li>
      <li>Check your Console for errors.</li>
      <li>Check your Network Tab for failed requests.</li>
    </ul>
  </div>
))

const RunnablesList = observer(({ runnables }) => (
  <ul className='runnables'>
    {_.map(runnables, (runnable) => <Runnable key={runnable.id} model={runnable} />)}
  </ul>
))

function content ({ isReady, runnables }, specPath) {
  if (!isReady) return null

  return runnables.length ? <RunnablesList runnables={runnables} /> : <NoTests specPath={specPath} />
}

@observer
class Runnables extends Component {
  render () {
    const { runnablesStore, specPath } = this.props

    return (
      <div ref='container' className='container'>
        <div className='wrap'>
          {content(runnablesStore, specPath)}
        </div>
      </div>
    )
  }

  componentDidMount () {
    scroller.setContainer(this.refs.container)
  }
}

export { NoTests, RunnablesList }
export default Runnables
