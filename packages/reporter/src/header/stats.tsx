import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore-next-line
import Tooltip from '@cypress/react-tooltip'
import { StatsStore } from './stats-store'
import runnablesStore from '../runnables/runnables-store'

const count = (num: number) => num > 0 ? num : '--'
const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

interface Props {
  stats: StatsStore
}

const Stats = observer(({ stats }: Props) => (
  <ul aria-label='Stats' className='stats'>
    <li>
      <button className='passed' onClick={() => runnablesStore.setFilter('passed')} disabled={runnablesStore.activeFilter === 'passed'}>
        <i aria-hidden="true" className='fas fa-check'></i>
        <span className='visually-hidden'>Passed:</span>
        <span className='num'>{count(stats.numPassed)}</span>
      </button>
    </li>
    <li>
      <button onClick={() => runnablesStore.setFilter('failed')} className="failed" disabled={runnablesStore.activeFilter === 'failed'}>
        <i aria-hidden="true" className='fas fa-times'></i>
        <span className='visually-hidden'>Failed:</span>
        <span className='num'>{count(stats.numFailed)}</span>
      </button>
    </li>
    <li>
      <button className='pending' onClick={() => runnablesStore.setFilter('processing')} disabled={runnablesStore.activeFilter === 'processing'}>
        <i aria-hidden="true" className='fas fa-circle-notch'></i>
        <span className='visually-hidden'>Pending:</span>
        <span className='num'>{count(stats.numPending)}</span>
      </button>
    </li>
    {runnablesStore.activeFilter !== null && <li>
      <Tooltip placement='bottom' title={<p>Clear the filter</p>}>
        <button onClick={() => runnablesStore.setFilter(null)} className="clear">
          <i aria-hidden="true" className='fas fa-trash-alt'></i>
          <span className='visually-hidden'>Clear</span>
        </button>
      </Tooltip>
    </li>}
    <li className='duration'>
      <span className='num'>{formatDuration(stats.duration)}</span>
    </li>
  </ul>
))

export default Stats
