import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import { indent } from '../lib/util'

import Agents from './agents'
import Hooks from './hooks'
import Routes from './routes'
import Collapsible from '../collapsible/collapsible'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

const TestHeader = observer(({ model }) => (
  <span>
    <i className='runnable-state fa'></i>
    <span className='runnable-title'>{model.title}</span>
    <div className='runnable-controls'>
      <i className='fa fa-warning' title='One or more commands failed'></i>
    </div>
  </span>
))

const LONG_RUNNING_THRESHOLD = 500

@observer
class Test extends Component {
  // the purpose of the _isLongRunning property and the following several
  // methods is to expand the test if the test's state is 'active'
  // for more than the LONG_RUNNING_THRESHOLD
  @observable _isLongRunning = false

  componentWillMount () {
    this._prevState = this.props.model.state

    if (this._isActive()) {
      this._startTimingActive()
    }
  }

  componentWillReact () {
    if (this._becameActive()) {
      this._startTimingActive()
    }

    if (this._becameInactive()) {
      clearTimeout(this._activeTimeout)
      action('became:inactive', () => this._isLongRunning = false)()
    }

    this._prevState = this.props.model.state
  }

  _startTimingActive () {
    this._activeTimeout = setTimeout(action('long:running', () => {
      if (this._isActive()) {
        this._isLongRunning = true
      }
    }), LONG_RUNNING_THRESHOLD)
  }

  _becameActive () {
    return !this._wasActive() && this._isActive()
  }

  _becameInactive () {
    return this._wasActive() && !this._isActive()
  }

  _wasActive () {
    return this._prevState === 'active'
  }

  _isActive () {
    return this.props.model.state === 'active'
  }

  render () {
    const { model } = this.props

    return (
      <div className='runnable-wrapper' style={{ paddingLeft: indent(model.level) }}>
        <Collapsible
          header={<TestHeader model={model} />}
          headerClass='runnable-content-region'
          contentClass='runnable-instruments'
          isOpen={model.state === 'failed' || this._isLongRunning}
        >
          <Agents model={model} />
          <Routes model={model} />
          <div className='runnable-commands-region'>
            {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
          </div>
        </Collapsible>
        <pre className='test-error'>{model.error}</pre>
      </div>
    )
  }
}

export default Test
