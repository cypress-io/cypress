import React from 'react'
import { observer } from 'mobx-react'
import ipc from '../lib/ipc'
import { getExperiments } from '@packages/server/lib/experiments'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/experiments')
}

const openIssue = (number) => (e) => {
  e.preventDefault()
  ipc.externalOpen(`https://github.com/cypress-io/cypress/issues/${number}`)
}

const Experiments = observer(({ project }) => {
  const experiments = getExperiments(project)

  const ComponentTesting = () => {
    if (!experiments.experimentalComponentTesting) {
      return null
    }

    <div>
      <h3>component testing <code>status: {experiments.experimentalComponentTesting.enabled ? 'enabled' : 'disabled'}</code></h3>
      <p className="text-muted">
          Changes how certain spec files are mounted. Instead of <code>cy.visit</code> you would use
          framework-specific <code>cypress-X-unit-test</code> library to mount your component directly from the spec file.
          See issue <a href='#' onClick={openIssue(5922)}>5922</a>
      </p>
      <p>config key <code>experimentalComponentTesting</code> default value <code>false</code> current
        value <code>{experiments.experimentalComponentTesting.value.toString()}</code></p>
    </div>
  }

  return (
    <div>
      <a href='#' className='learn-more' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>

      <div>
        <p>
        You can enable some beta features still under development by setting a special config settings that start
        with "experimental" prefix.
        </p>
      </div>

      <ComponentTesting />
    </div>
  )
})

export default Experiments
