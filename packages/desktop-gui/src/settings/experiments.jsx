import React from 'react'
import { observer } from 'mobx-react'
import ipc from '../lib/ipc'
import { get } from 'lodash'
import { parseExperiments } from '@packages/runner/src/lib/experiments'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/experiments')
}

const openIssue = (number) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://github.com/cypress-io/cypress/issues/${number}`)
}

const Experiments = observer(({ project }) => {
  const resolvedEnv = get(project, 'resolvedConfig.env.EXPERIMENTS.value', '')
  const experiments = parseExperiments(resolvedEnv)

  return (
    <div>
      <a href='#' className='learn-more' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>

      <div>
        <p>
        You can enable some beta features still under development by setting a special environment variable while running
        Cypress. For example to enable experiments "featureA" and "featureB", open or run Cypress with:
        </p>

        <pre className='line-nums'>
          <span>CYPRESS_EXPERIMENTS=featureA,featureB cypress open</span>
          <span># or</span>
          <span>CYPRESS_EXPERIMENTS=featureA,featureB cypress run</span>
        </pre>

        {resolvedEnv &&
          <>
            <p>The environment variable currently has the value</p>
              <pre className='line-nums'>
                <span>CYPRESS_EXPERIMENTS={resolvedEnv}</span>
              </pre>
          </>
        }
      </div>

      <div>
        <h3>{experiments.componentTesting ? '✔️' : '🚫'} component testing</h3>
        <p className="text-muted">
          Changes how certain spec files are mounted. Instead of <code>cy.visit</code> you would use
          framework-specific <code>cypress-X-unit-test</code> library to mount your component directly from the spec file.
          See issue <a href='#' onClick={openIssue(5922)}>5922</a>
        </p>
        <p>{experiments.componentTesting
          ? 'This experiment was enabled with'
          : 'To enable this experiment start Cypress with environment variable'}</p>
        <pre className='line-nums'>
          <span>CYPRESS_EXPERIMENTS=componentTesting cypress open</span>
          <span># or</span>
          <span>CYPRESS_EXPERIMENTS=componentTesting cypress run</span>
        </pre>
      </div>
    </div>
  )
})

export default Experiments
