import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import { StatsStore } from './stats-store'

import FailedIcon from '@packages/frontend-shared/src/assets/icons/status-failed_x12.svg'
import PassedIcon from '@packages/frontend-shared/src/assets/icons/status-passed_x12.svg'
import PendingIcon from '@packages/frontend-shared/src/assets/icons/status-pending_x12.svg'

const count = (num: number) => num > 0 ? num : '--'

interface Props {
  stats: StatsStore
}

const Stats = observer(({ stats }: Props) => (
  <ul aria-label='Stats' className='stats'>
    <li className='passed'>
      <PassedIcon aria-hidden="true" />
      <span className='visually-hidden'>Passed:</span>
      <span className={cs('num', { 'empty': !stats.numPassed })}>{count(stats.numPassed)}</span>
    </li>
    <li className='failed'>
      <FailedIcon aria-hidden="true" />
      <span className='visually-hidden'>Failed:</span>
      <span className={cs('num', { 'empty': !stats.numFailed })}>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <PendingIcon aria-hidden="true" />
      <span className='visually-hidden'>Pending:</span>
      <span className={cs('num', { 'empty': !stats.numPending })}>{count(stats.numPending)}</span>
    </li>
  </ul>
))

export default Stats
