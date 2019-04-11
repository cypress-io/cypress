import cs from 'classnames'
import _ from 'lodash'
import { action, computed, observable } from 'mobx'
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
    const { isOpen, model, isLast } = this.props

    // performance optimization - don't render contents if not open
    if (!isOpen) return null

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
            <pre className={cs('attempt-error', { 'test-error': isLast })}>{model.err.displayMessage}</pre>
          </FlashOnClick>
        </div>
      </Fragment>
    )
  }
}

@observer
class Attempt extends Component {
  @observable isOpen = null

  static defaultProps = {
    appState,
    scroller,
  }

  @computed get _shouldBeOpen () {
    const { model, isSingle, isLast } = this.props

    // if there are no retries, the 'Attempt #' header will not be
    // shown and it will not be collapsible, so it should always be open
    if (isSingle) return true

    // if this.isOpen is non-null, prefer that since the user has
    // explicity chosen to open or close the test
    if (this.isOpen !== null) return this.isOpen

    // otherwise, look at reasons to auto-open the test
    return model.isOpen
           || model.isLongRunning
           || isLast
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
    const { index, model, isLast } = this.props

    return (
      <li
        ref='container'
        className={cs('attempt-item', `attempt-state-${model.state}`, {
          'attempt-failed': model.failed,
        })}
      >
        <Collapsible
          header={<AttemptHeader index={index} isOpen={this._shouldBeOpen} />}
          headerClass='attempt-name'
          isOpen={this._shouldBeOpen}
          onToggle={this._toggleOpen}
        >
          <AttemptContent
            isOpen={this._shouldBeOpen}
            model={model}
            isLast={isLast}
          />
        </Collapsible>
      </li>
    )
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen
    } else {
      this.isOpen = !this.isOpen
    }
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
          isSingle={!test.hasMultipleAttempts}
          isLast={test.isLastAttempt(attempt)}
          model={attempt}
        />
      )
    })}
  </ul>
))

export { Attempt, AttemptHeader, NoCommands }

export default Attempts
