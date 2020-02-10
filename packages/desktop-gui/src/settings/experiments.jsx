import React from 'react'
import { get } from 'lodash'
import { observer } from 'mobx-react'
import ipc from '../lib/ipc'
import { getExperiments } from '@packages/server/lib/experiments'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/experiments')
}

const Experiments = observer(({ project }) => {
  const experiments = getExperiments(project)
  const resolvedEnv = get(project, 'resolvedConfig', {})

  const ComponentTesting = () => {
    if (!experiments.experimentalComponentTesting) {
      return null
    }

    const experiment = experiments.experimentalComponentTesting
    const componentFolder = get(resolvedEnv, 'componentFolder.value', 'false')

    return (
      <li className='experiment' data-cy="component-testing">
        <div className='experiment-desc'>
          <h5>Component Testing</h5>
          <p className="flag">
            Experimental flag: <code>experimentalComponentTesting</code>
          </p>
          <p className="text-muted">
            Enables the use of component testing using framework-specific libraries to mount your component directly from the spec file.
            The component tests will be loaded from the folder specified in the project config under the key <code>componentFolder</code>,
            currently it has the resolved value <code>{componentFolder}</code>.
          </p>
        </div>
        <div className='experiment-status'>
          <span className='experiment-status-sign'>
            {experiment.enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </li>
    )
  }

  return (
    <div data-cy="experiments">
      <a href='#' className='learn-more' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>

      <div>
        <p className='experiment-intro'>
          If you'd like to try out what we're working on, you can enable these beta features for your project by setting configuration using the <code>experimental</code> prefix.
        </p>
      </div>
      <ul className='experiments-list'>
        <ComponentTesting />
      </ul>
    </div>
  )
})

export default Experiments
