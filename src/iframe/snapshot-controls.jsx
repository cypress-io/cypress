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
        <Tooltip title='Unpin'>
          <button className='unpin' onClick={this._unpin}>
            <i className='fa fa-thumb-tack' />
          </button>
        </Tooltip>
        {this._selectionToggle()}
        {this._states()}
      </span>
    )
  }

  _selectionToggle () {
    if (!this.props.snapshotProps.$el) return null

    const showingHighlights = this.props.state.snapshot.showingHighlights

    return (
      <Tooltip title={`${showingHighlights ? 'Hide' : 'Show'} highlights`}>
        <button className='toggle-selection' onClick={this._toggleHighlights}>
          <i className='fa fa-object-group' />
        </button>
      </Tooltip>
    )
  }

  _states () {
    const { snapshots } = this.props.snapshotProps

    if (snapshots.length < 2) return null

    return (
      <span className='snapshot-state-picker'>
        <span>State:</span>
        {_.map(snapshots, (snapshot, index) => (
          <button key={snapshot.name || index} href="#">
            {snapshot.name || index + 1}
          </button>
        ))}
      </span>
    )
  }

  _unpin = () => {
    this.props.runner.snapshotUnpinned()
  }

  @action _toggleHighlights = () => {
    this.props.onToggleHighlights(this.props.snapshotProps)
  }
}

export default SnapshotControls
