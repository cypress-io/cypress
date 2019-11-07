import { observer } from 'mobx-react'
import React from 'react'

const count = (num) => num > 0 ? num : '--'
const formatDuration = (duration) => duration > 0 ? (duration / 1000).toFixed(2) : 0

const Stats = observer(({ stats }) => (
  <ul aria-label='Stats' className='stats'>
    <li className='passed'>
      <i aria-hidden="true" className='fa fa-check'></i>
      <span className='visually-hidden'>Passed:</span>
      <span className='num'>{count(stats.numPassed)}</span>
    </li>
    <li className='failed'>
      <i aria-hidden="true" className='fa fa-times'></i>
      <span className='visually-hidden'>Failed:</span>
      <span className='num'>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <i aria-hidden="true" className='fa fa-circle-o-notch'></i>
      <span className='visually-hidden'>Pending:</span>
      <span className='num'>{count(stats.numPending)}</span>
    </li>
    <li className='duration'>
      <span className='num'>{count(formatDuration(stats.duration))}</span>
    </li>
  </ul>
))

export default Stats
