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

  return (
    <div>
      <a href='#' className='learn-more' data-cy='experiments' onClick={openHelp}>
        <i className='fas fa-info-circle'></i> Learn more
      </a>
      <div>
        <p className='experiment-intro'>
          If you'd like to try out what we're working on, you can enable these beta features for your project by setting configuration using the <code>experimental</code> prefix.
        </p>
      </div>
      <ul className='experiments-list'>
        {
          _.map(experiments, (experiment, i) => (
            <li className='experiment' key={i}>
              <h5>
                {experiment.name}
                <span className={`experiment-status-sign ${experiment.enabled ? 'enabled' : ''}`}>
                  {experiment.enabled ? 'ON' : 'OFF'}
                </span>
              </h5>
              <div className='experiment-desc'>
                <p className="text-muted">
                  {experiment.summary}
                </p>
                <div className='experiment-status'>
                  <code>{experiment.key}</code>
                </div>
              </div>
            </li>
          ))
        }
      </ul>
    </div>
  )
})

export default Experiments
