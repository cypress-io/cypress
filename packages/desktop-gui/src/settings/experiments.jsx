import _ from 'lodash'
import React from 'react'
import { observer } from 'mobx-react'
import ipc from '../lib/ipc'
import experiments from '@packages/server/lib/experiments'
import MarkdownRenderer from '../lib/markdown-renderer'

const openHelp = (e) => {
  e.preventDefault()
  ipc.externalOpen('https://on.cypress.io/experiments')
}

const Experiments = observer(({ project }) => {
  const knownExperiments = experiments.getExperiments(project)

  return (
    <div data-cy='experiments'>
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
          _.map(knownExperiments, (experiment, i) => (
            <li className='experiment' key={i}>
              <div className='experiment-header'>
                <h5>
                  <MarkdownRenderer markdown={experiment.name} noParagraphWrapper/>
                </h5>
                <span className={`experiment-status-sign ${experiment.enabled ? 'enabled' : 'disabled'}`}>
                  {experiment.enabled ? 'enabled' : 'disabled'}
                </span>
              </div>
              <div className='experiment-desc'>
                <p className="text-muted">
                  <MarkdownRenderer markdown={experiment.summary} noParagraphWrapper/>
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
