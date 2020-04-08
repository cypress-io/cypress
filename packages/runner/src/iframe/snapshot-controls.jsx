import cs from 'classnames'
import _ from 'lodash'
import { action } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'
import Tooltip from '@cypress/react-tooltip'

@observer
class SnapshotControls extends Component {
  render () {
    return (
      <span
        className={cs('snapshot-controls', {
          'showing-selection': this.props.state.snapshot.showingHighlights,
        })}
      >
        {this._selectionToggle()}
        {this._states()}
        <Tooltip title='Unpin' className='cy-tooltip'>
          <button className='unpin' onClick={this._unpin}>
            <i className='fas fa-times' />
          </button>
        </Tooltip>
      </span>
    )
  }

  _selectionToggle () {
    if (!this.props.snapshotProps.$el) return null

    const showingHighlights = this.props.state.snapshot.showingHighlights

    return (
      <Tooltip title={`${showingHighlights ? 'Hide' : 'Show'} Highlights`} className='cy-tooltip'>
        <button className='toggle-selection' onClick={this._toggleHighlights}>
          <i className='far fa-object-group' />
        </button>
      </Tooltip>
    )
  }

  _states () {
    const { snapshots } = this.props.snapshotProps

    if (snapshots.length < 2) return null

    return (
      <span className='snapshot-state-picker'>
        {_.map(snapshots, (snapshot, index) => (
          <button
            className={cs({
              'state-is-selected': this.props.state.snapshot.stateIndex === index,
            })}
            key={snapshot.name || index}
            href="#"
            onClick={this._changeState(index)}
          >
            {snapshot.name || index + 1}
          </button>
        ))}
      </span>
    )
  }

  _unpin = () => {
    this.props.eventManager.snapshotUnpinned()
  }

  @action _toggleHighlights = () => {
    this.props.onToggleHighlights(this.props.snapshotProps)
  }

  _changeState = (index) => action('change:snapshot:state', () => {
    this.props.onStateChange(this.props.snapshotProps, index)
  })
}

export default SnapshotControls
