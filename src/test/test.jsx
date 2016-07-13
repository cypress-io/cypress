import cs from 'classnames'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '../tooltip/tooltip'

import events from '../lib/events'
import { indent } from '../lib/util'
import runnablesStore from '../runnables/runnables-store'

import Hooks from '../hooks/hooks'
import Agents from '../agents/agents'
import Routes from '../routes/routes'
import FlashOnClick from '../lib/flash-on-click'

const NoCommands = observer(() => (
  <ul className='hooks-container'>
    <li className='no-commands'>
      No commands were issued in this test.
    </li>
  </ul>
))

@observer
class Test extends Component {
  @observable isOpen = null

  render () {
    const { model } = this.props

    return (
      <div
        className={cs('runnable-wrapper', { 'is-open': this._shouldBeOpen() })}
        onClick={this._toggleOpen}
        style={{ paddingLeft: indent(model.level) }}
      >
        <div className='runnable-content-region'>
          <i className='runnable-state fa'></i>
          <span className='runnable-title'>{model.title}</span>
          <div className='runnable-controls'>
            <Tooltip placement='left' align={{ offset: [0, 0] }} title='One or more commands failed'>
              <i className='fa fa-warning'></i>
            </Tooltip>
          </div>
        </div>
        <div
          className='runnable-instruments collapsible-content'
          onClick={(e) => { e.stopPropagation() }}
        >
          <Agents model={model} />
          <Routes model={model} />
          <div className='runnable-commands-region'>
            {model.commands.length ? <Hooks model={model} /> : <NoCommands />}
          </div>
        </div>
        <FlashOnClick
          message='Printed output to your console!'
          onClick={() => events.emit('show:error', model.id)}
        >
          <pre className='test-error'>{model.err.displayMessage}</pre>
        </FlashOnClick>
      </div>
    )
  }

  _shouldBeOpen () {
    // means isOpen has been explicitly set by the user clicking the test
    if (this.isOpen !== null) return this.isOpen

    return this.props.model.state === 'failed' || this.props.model.isLongRunning || runnablesStore.hasSingleTest
  }

  @action _toggleOpen = () => {
    if (this.isOpen === null) {
      this.isOpen = !this._shouldBeOpen()
    } else {
      this.isOpen = !this.isOpen
    }
  }
}

export default Test
