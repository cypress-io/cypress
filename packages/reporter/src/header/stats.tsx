import { observer } from 'mobx-react'
import React from 'react'

import { StatsStore } from './stats-store'

const count = (num: number) => num > 0 ? num : '--'

interface Props {
  stats: StatsStore
}

const Stats = observer(({ stats }: Props) => (
  <>
    <li className='reporter-li reporter-passed'>
      <i aria-hidden="true" className='fas fa-check reporter-icon' />
      <span className='visually-hidden'>Passed:</span>
      <span className='num'>{count(stats.numPassed)}</span>
    </li>
    <li className='reporter-li reporter-failed'>
      <i aria-hidden="true" className='fas fa-times reporter-icon' />
      <span className='visually-hidden'>Failed:</span>
      <span className='num'>{count(stats.numFailed)}</span>
    </li>
    <li className='reporter-li reporter-pending'>
      <i aria-hidden="true" className='fas fa-circle-notch reporter-icon' />
      <span className='visually-hidden'>Pending:</span>
      <span className='num'>{count(stats.numPending)}</span>
    </li>
  </>
))

export default Stats
