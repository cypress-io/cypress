import { observer } from 'mobx-react'
import React from 'react'

const count = (num) => num > 0 ? num : '--'
const formatDuration = (duration) => duration > 0 ? (duration / 1000).toFixed(2) : 0

const Stats = observer(({ stats }) => (
  <ul className='stats'>
    <li className='passed'>
      <i className='fa fa-check'></i>
      <span className='num'>{count(stats.numPassed)}</span>
    </li>
    <li className='failed'>
      <i className='fa fa-times'></i>
      <span className='num'>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <i className='fa fa-circle-o-notch'></i>
      <span className='num'>{count(stats.numPending)}</span>
    </li>
    <li className='duration'>
      <span className='num'>{count(formatDuration(stats.duration))}</span>
    </li>
  </ul>
))

export default Stats
