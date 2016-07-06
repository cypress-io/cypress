import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Runnable from './runnable-and-suite'

const NoTests = observer(({ spec }) => (
  <div className='no-tests'>
    <h4>
      <i className='fa fa-warning'></i>
      Sorry, there's something wrong with this file:
      <a href='https://on.cypress.io/theres-something-wrong-with-this-file' target='_blank'>
        <i className='fa fa-question-circle'></i>
      </a>
    </h4>
    <pre>{spec}</pre>
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

function content ({ isReady, runnables }, spec) {
  if (!isReady) return null

  return runnables.length ? <RunnablesList runnables={runnables} /> : <NoTests spec={spec} />
}

const Runnables = observer(({ runnablesStore, spec }) => (
  <div className='container'>
    <div className='wrap'>
      {content(runnablesStore, spec)}
    </div>
  </div>
))

export default Runnables
