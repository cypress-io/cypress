import { observer } from 'mobx-react'
import React from 'react'

import { StatsStore } from './stats-store'

const count = (num: number) => num > 0 ? num : '--'

interface Props {
  stats: StatsStore
}

const Stats = observer(({ stats }: Props) => (
  <ul aria-label='Stats' className='stats'>
    <li className='passed'>
      <i aria-hidden="true" className='fas fa-check' />
      <span className='visually-hidden'>Passed:</span>
      <span className='num'>{count(stats.numPassed)}</span>
    </li>
    <li className='failed'>
      <i aria-hidden="true" className='fas fa-times' />
      <span className='visually-hidden'>Failed:</span>
      <span className='num'>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <i aria-hidden="true" className='fas fa-circle-notch' />
      <span className='visually-hidden'>Pending:</span>
      <span className='num'>{count(stats.numPending)}</span>
    </li>
  </ul>
))

export default Stats
