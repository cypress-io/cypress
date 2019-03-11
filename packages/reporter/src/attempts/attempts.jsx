import cs from 'classnames'
import _ from 'lodash'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component, Fragment } from 'react'

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

const AttemptHeader = ({ index, isOpen }) => (
  <span className='attempt-tag'>
    <span className={cs('open-close-indicator', { 'is-open': isOpen })}>
      <i className='fa fa-fw fa-angle-up' />
      <i className='fa fa-fw fa-angle-down' />
    </span>
    Attempt {index + 1}
    <i className='attempt-state runnable-state fa fa-fw' />
  </span>
)

const AttemptContent = ({ isOpen, model }) => {
  // performance optimization - don't render contents if not open
  if (!isOpen) return null

  return (
    <Fragment>
      <Agents model={model} />
      <Routes model={model} />
      <div className='runnable-commands-region'>
        {model.hasCommands ? <Hooks model={model} /> : <NoCommands />}
      </div>
    </Fragment>
  )
}

@observer
class Attempt extends Component {
  @observable isOpen = null

  render () {
    const { index, model } = this.props

    return (
      <li className={cs('attempt-item', `attempt-state-${model.state}`, { 'attempt-failed': model.failed })}>
        <Collapsible
          header={<AttemptHeader index={index} isOpen={this._shouldBeOpen()} />}
          headerClass='attempt-name'
          isOpen={this._shouldBeOpen()}
          onToggle={this._toggleOpen}
        >
          <AttemptContent isOpen={this._shouldBeOpen()} model={model} />
        </Collapsible>
      </li>
    )
  }

  _shouldBeOpen () {
    const { model, test } = this.props

    // if there are no retries, the 'Attempt #' header will not be
    // shown and it will not be collapsible, so it should always be open
    if (!test.hasMultipleAttempts) return true

    // if this.isOpen is non-null, prefer that since the user has
    // explicity chosen to open or close the test
    if (this.isOpen !== null) return this.isOpen

    // otherwise, look at reasons to auto-open the test
    return model.isOpen
           || model.isLongRunning
           || test.isLastAttempt(model)
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen()
    } else {
      this.isOpen = !this.isOpen
    }
  }
}

const Attempts = observer(({ attempts, test }) => (
  <ul className={cs('attempts', { 'has-mutiple-attempts': test.hasMultipleAttempts })}>
    {_.map(attempts, (attempt, index) => {
      return <Attempt key={index} model={attempt} index={index} test={test} />
    })}
  </ul>
))

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
