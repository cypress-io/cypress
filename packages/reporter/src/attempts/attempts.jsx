import cs from 'classnames'
import _ from 'lodash'
import { observer } from 'mobx-react'
import React, { Component, Fragment } from 'react'

import appState from '../lib/app-state'
import events from '../lib/events'
import scroller from '../lib/scroller'

import Agents from '../agents/agents'
import Collapsible from '../collapsible/collapsible'
import FlashOnClick from '../lib/flash-on-click'
import Hooks from '../hooks/hooks'
import Routes from '../routes/routes'

const NoCommands = () => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
)

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

@observer
class AttemptContent extends Component {
  render () {
    const { model } = this.props

    // performance optimization - don't render contents if not open
    if (!model.isOpen) return null

    const onErrorClick = (e) => {
      e.stopPropagation()
      events.emit('show:error', model.testId, model.id)
    }

    return (
      <Fragment>
        <Agents model={model} />
        <Routes model={model} />
        <div ref='commands' className='runnable-commands-region'>
          {model.hasCommands ? <Hooks model={model} /> : <NoCommands />}
        </div>
        <div className='attempt-error-region'>
          <FlashOnClick
            message='Printed output to your console'
            onClick={onErrorClick}
          >
            <pre className={cs('attempt-error', { 'test-error': model.isLast })}>{model.err.displayMessage}</pre>
          </FlashOnClick>
        </div>
      </Fragment>
    )
  }
}

@observer
class Attempt extends Component {

  static defaultProps = {
    appState,
    scroller,
  }

  componentDidMount () {
    this._scrollIntoView()
    this.props.model.callbackAfterUpdate()
  }

  componentDidUpdate () {
    this._scrollIntoView()
    this.props.model.callbackAfterUpdate()
  }

  _scrollIntoView () {
    const { appState, model, scroller } = this.props
    const { isActive } = model

    if (appState.autoScrollingEnabled && appState.isRunning && isActive != null) {
      scroller.scrollIntoView(this.refs.container)
    }
  }

  render () {
    const { index, model } = this.props

    return (
      <li
        ref='container'
        className={cs('attempt-item', `attempt-state-${model.state}`, {
          'attempt-failed': model.failed,
        })}
      >
        <Collapsible
          header={<AttemptHeader index={index} isOpen={model.isOpen} />}
          headerClass='attempt-name'
          isOpen={model.isOpen}
          onToggle={model.toggleOpen}
        >
          <AttemptContent
            model={model}
          />
        </Collapsible>
      </li>
    )
  }

}

const Attempts = observer(({ test }) => (
  <ul className={cs('attempts', {
    'has-multiple-attempts': test.hasMultipleAttempts,
  })}>
    {_.map(test.attempts, (attempt, index) => {
      return (
        <Attempt
          key={attempt.id}
          index={index}
          model={attempt}
        />
      )
    })}
  </ul>
))

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
