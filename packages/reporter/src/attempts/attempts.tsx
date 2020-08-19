import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import Agents from '../agents/agents'
import Collapsible from '../collapsible/collapsible'
import Hooks from '../hooks/hooks'
import Routes from '../routes/routes'
import TestError from '../errors/test-error'
import TestModel from '../test/test-model'
import AttemptModel from './attempt-model'

const NoCommands = () => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
)

const AttemptHeader = ({ index }:{index: number}) => (
  <span className='attempt-tag'>
    <span className='open-close-indicator'>
      <i className='fa fa-fw fa-angle-up' />
      <i className='fa fa-fw fa-angle-down' />
    </span>
    Attempt {index + 1}
    <i className="attempt-state fa fa-fw" />
  </span>
)

function renderAttemptContent (model: AttemptModel) {
  // performance optimization - don't render contents if not open

  return (
    <div className={`attempt-${model.id + 1}`}>
      <Agents model={model} />
      <Routes model={model} />
      <div ref='commands' className='runnable-commands-region'>
        {model.hasCommands ? <Hooks model={model} /> : <NoCommands />}
      </div>

      <div className='attempt-error-region'>
        <TestError model={model} isTestError={model.isLast} />
      </div>
    </div>
  )
}

@observer
class Attempt extends Component<{model: AttemptModel, scrollIntoView: Function}> {
  componentDidUpdate () {
    this.props.scrollIntoView()
  }

  render () {
    const { model } = this.props

    // HACK: causes component update when command log is added
    model.commands.length

    return (
      <li

        key={model.id}
        className={cs('attempt-item', `attempt-state-${model.state}`, {
          'attempt-failed': model.state === 'failed',
        })}
        ref="container"
      >
        <Collapsible
          header={<AttemptHeader index={model.id}/>}
          headerClass='attempt-name'
          isOpen={model.isOpen}
        >
          {renderAttemptContent(model)}
        </Collapsible>
      </li>
    )
  }
}

const Attempts = observer(({ test, scrollIntoView }: {test: TestModel, scrollIntoView: Function}) => {
  return (<ul className={cs('attempts', {
    'has-multiple-attempts': test.hasMultipleAttempts,
  })}>
    {_.map(test.attempts, (attempt) => {
      return (
        <Attempt
          key={attempt.id}
          scrollIntoView={scrollIntoView}
          model={attempt}
        />
      )
    })}
  </ul>)
})

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
