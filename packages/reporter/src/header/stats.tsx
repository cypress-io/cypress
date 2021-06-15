import { observer } from 'mobx-react'
import React from 'react'

import { StatsStore } from './stats-store'

const count = (num: number) => num > 0 ? num : '--'
const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

const showTestFailedResults = (cb) => {
  addToggleToElement('runnables', 'is-hidden')

  return cb()
}

const addToggleToElement = (el, classToToggle) => {
  const elements = Array.from(document.getElementsByClassName(el))

  elements.forEach((element) => {
    element.classList.toggle(classToToggle)
  })
}

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
    <li className={`${stats.showOnlyFailedTest ? 'is-failed-test-pinned' : ''} ${(!stats._isRunOver && stats.numFailed <= 0) ? 'is-disabled' : ''} failed`} onClick={() => showTestFailedResults(() => stats.toggleShowOnlyFailedTest())}>
      <i aria-hidden="true" className='fas fa-times' />
      <span className='visually-hidden'>Failed:</span>
      <span className='num'>{count(stats.numFailed)}</span>
    </li>
    <li className='pending'>
      <i aria-hidden="true" className='fas fa-circle-notch' />
      <span className='visually-hidden'>Pending:</span>
      <span className='num'>{count(stats.numPending)}</span>
    </li>
    <li className='duration'>
      <span className='num'>{formatDuration(stats.duration)}</span>
    </li>
  </ul>
))

export default Stats
