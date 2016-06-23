import { observer } from 'mobx-react'
import React from 'react'
import statsStore from './stats-store'

const count = (num) => num > 0 ? num : '--'
const formatDuration = (duration) => duration > 0 ? (duration / 1000).toFixed(2) : 0

export default observer(() => (
  <ul className='stats'>
    <li className='passed'>
      <i className='fa fa-check'></i>
      <span className='num'>{count(statsStore.passed)}</span>
    </li>
    <li className='failed'>
      <i className='fa fa-times'></i>
      <span className='num'>{count(statsStore.failed)}</span>
    </li>
    <li className='pending'>
      <i className='fa fa-circle-o-notch'></i>
      <span className='num'>{count(statsStore.pending)}</span>
    </li>
    <li className='duration'>
      <span className='num'>{count(formatDuration(statsStore.duration))}</span>
    </li>
  </ul>
))
