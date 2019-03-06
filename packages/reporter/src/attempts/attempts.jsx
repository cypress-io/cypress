import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React from 'react'
import Collapsible from '../collapsible/collapsible'
import Hooks from '../hooks/hooks'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

const AttemptHeader = ({ attempt, retriesCount }) => (
  <span className='attempt-tag'>
    <i className='fa-sort fa fa-fw'></i>
    Attempt {attempt.id}
    <span className='hook-failed-message'>
      <i className='fa-close fa fa-fw'></i>
    </span>
  </span>
)

const Attempt = observer(({ model, attempt, retriesCount }) => (
  <li className={cs('attempt-item', { 'attempt-failed': model.failed })}>
    <Collapsible
      header={<AttemptHeader attempt={attempt} retriesCount={retriesCount} />}
      headerClass='attempt-name'
      isOpen={true}
    >
      <ul className='hooks-container'>
        {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
      </ul>
    </Collapsible>
  </li>
))

const Attempts = observer(({ model, attempts, retriesCount }) => (
  <ul className='attempts'>
    {_.map(attempts, (attempt) => <Attempt key={attempt.id} model={model} attempt={attempt} retriesCount={retriesCount} />)}
  </ul>
))

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
