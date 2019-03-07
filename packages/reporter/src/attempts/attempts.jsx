import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'

import Agents from '../agents/agents'
import Collapsible from '../collapsible/collapsible'
import Hooks from '../hooks/hooks'
import Routes from '../routes/routes'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

const AttemptHeader = ({ index }) => (
  <span className='attempt-tag'>
    <i className='fa-sort fa fa-fw'></i>
    Attempt {index + 1}
    <span className='attempt-status-indicator'>
      <i className='fa-close fa fa-fw'></i>
    </span>
  </span>
)

const Attempt = observer(({ model, index }) => (
  <li className={cs('attempt-item', { 'attempt-failed': model.failed })}>
    <Collapsible
      header={<AttemptHeader index={index} />}
      headerClass='attempt-name'
      isOpen={true}
    >
      <Agents model={model} />
      <Routes model={model} />
      <div className='runnable-commands-region'>
        {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
      </div>
    </Collapsible>
  </li>
))

const Attempts = observer(({ model, attempts }) => (
  <ul className='attempts'>
    {_.map(attempts, (attempt, index) => {
      return <Attempt key={index} model={model} attempt={attempt} index={index} />
    })}
  </ul>
))

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
