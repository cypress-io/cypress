import cs from 'classnames'
import React from 'react'
import { observer } from 'mobx-react'

const NextSteps = observer(({ project, app }) => {
  return (<div className={cs('next-steps', 'well')}>
    <p className='header'>
      <i className='fas fa-check-circle'></i>{' '}
      <strong>Next Steps</strong>
    </p>

    <div className={cs('well')}>
      <h4>Run Cypress on CI in one-line</h4>
      <p>Circle</p>
      <code>.circle.yml</code>
      <p>Travis</p>
      <p>Netlify</p>
    </div>

    <div className={cs('well')}>
      <h4>Learn more</h4>
      <p>
                Read more about running Cypress in continuous integration environments
                in our docs:
        <a href="https://on.cypress.io/ci" target="_blank">Continuous Integration</a>
      </p>
      <video autoPlay
        src='https://docs.cypress.io/img/snippets/running-in-ci.0ad9991b.mp4'
      />
    </div>

    <div className={cs('well')}>
      <h4>Guru</h4>
      <button>Suggest an integration based on files in my project</button>
      <h4>Already implemented CI?</h4>
    </div>

    <p>If you've already implemented continuous integration with Cypress, you're ready for more next steps.</p>
    <button>Skip this</button>
  </div>)
})

export default NextSteps
