import _ from 'lodash'
import React from 'react'
import Runnable from './runnable'

const Empty = (props) => (
  <div className='no-tests'>
    <h4>
      <i className='fa fa-warning'></i>
      Sorry, there's something wrong with this file:
      <a href='https://on.cypress.io/theres-something-wrong-with-this-file' target='_blank'>
        <i className='fa fa-question-circle'></i>
      </a>
    </h4>
    <pre>{props.spec}</pre>
    <ul>
      <li>Have you written any tests?</li>
      <li>Are there typo’s or syntax errors?</li>
      <li>Check your Console for errors.</li>
      <li>Check your Network Tab for failed requests.</li>
    </ul>
  </div>
)

const Runnables = (props) => (
  <ul className='runnables'>
    {_.map(props.tests, (runnable) => <Runnable key={runnable.id} {...runnable} />)}
  </ul>
)

const Tests = (props) => (
  <div className='tests'>
    <div className='tests-wrap'>
      {props.tests.length ? <Runnables {...props} /> : <Empty {...props} />}
    </div>
  </div>
)

export default Tests
