import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import ipc from '../lib/ipc'
import { getExperiments } from '@packages/server/lib/experiments'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/experiments')
}

const Experiments = observer(({ project }) => {
  const experiments = getExperiments(project)

  let message

  if (_.isEmpty(experiments)) {
    message = (
      <p className='experiment-intro-empty'>
        This panel lists experimental features. Currently there are no ongoing experiments.
      </p>
    )
  } else {
    message = (
      <p className='experiment-intro'>
        If you'd like to try out what we're working on, you can enable these beta features for your project by setting configuration using the <code>experimental</code> prefix.
      </p>
    )
  }

  return (
    <div>
      <a href='#' className='learn-more' data-cy='experiments' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>

      <div>
        {message}
      </div>
      {!_.isEmpty(experiments) &&
        <ul className='experiments-list'>
          {
            _.map(experiments, (experiment, i) => (
              <li className='experiment' key={i}>
                <div className='experiment-desc'>
                  <h5>{experiment.name}</h5>
                  <p className="text-muted">
                    {experiment.summary}
                  </p>
                  <code>{experiment.key}</code>
                </div>
                <div className='experiment-status'>
                  <span className={`experiment-status-sign ${experiment.enabled ? 'enabled' : ''}`}>
                    {experiment.enabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              </li>
            ))
          }
        </ul>
      }
    </div>
  )
})

export default Experiments
