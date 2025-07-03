import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import type { StatsStore } from './stats-store'
import { IconStatusFailedSimple, IconStatusPassedSimple, IconStatusSkippedOutline } from '@cypress-design/react-icon'

const count = (num: number) => num > 0 ? num : '--'

interface Props {
  stats: StatsStore
}

const Stats: React.FC<Props> = observer(({ stats }: Props) => (
  <ul aria-label='Stats' className='stats'>
    <li className='passed'>
      <IconStatusPassedSimple size='12' strokeColor='jade-400' aria-hidden />
      <span className='visually-hidden'>Passed:</span>
      <span className={cs('num', { 'empty': !stats.numPassed })}>{count(stats.numPassed)}</span>
    </li>
    <li className='failed'>
      <IconStatusFailedSimple size='12' strokeColor='red-400' aria-hidden />
      <span className='visually-hidden'>Failed:</span>
      <span className={cs('num', { 'empty': !stats.numFailed })}>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <IconStatusSkippedOutline size='12' strokeColor='gray-400' aria-hidden />
      <span className='visually-hidden'>Pending:</span>
      <span className={cs('num', { 'empty': !stats.numPending })}>{count(stats.numPending)}</span>
    </li>
  </ul>
))

Stats.displayName = 'Stats'

export default Stats
