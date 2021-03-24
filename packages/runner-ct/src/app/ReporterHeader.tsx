import * as React from 'react'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
import { AppState } from '@packages/reporter/src/lib/app-state'
// import Stats from '@packages/reporter/src/header/stats'
// import Controls from '@packages/reporter/src/header/controls'
import { StatsStore } from '@packages/reporter/src/header/stats-store'
import { namedObserver } from '../lib/mobx'

const count = (num: number) => num > 0 ? num : '--'
const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

interface StatsProps {
  stats: StatsStore
}

const Stats = namedObserver('Stats', ({ stats }: StatsProps) => (
  <ul aria-label='Stats' className='stats'>
    <li className='passed'>
      <i aria-hidden="true" className='fas fa-check' />
      <span className='visually-hidden'>Passed:</span>
      <span className='num'>
        {count(stats.numPassed)}
      </span>
    </li>
    <li className='failed'>
      <i aria-hidden="true" className='fas fa-times' />
      <span className='visually-hidden'>Failed:</span>
      <span className='num'>
        {count(stats.numFailed)}
      </span>
    </li>
    <li className='pending'>
      <i aria-hidden="true" className='fas fa-circle-notch' />
      <span className='visually-hidden'>Pending:</span>
      <span className='num'>
        {count(stats.numPending)}
      </span>
    </li>
    <li className='duration'>
      <span className='num'>
        {formatDuration(stats.duration)}
      </span>
    </li>
  </ul>
))

import cs from 'classnames'
import { action } from 'mobx'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '@packages/reporter/src/lib/events'

const ifThen = (condition: boolean, component: React.ReactNode) => (
  condition ? component : null
)

interface ControlProps {
  events?: Events
  appState: AppState
}

// const Controls = namedObserver('Controls', ({ events = defaultEvents, appState }: ControlProps) => {

//   return (
//     <div className='controls'>

//       {ifThen(!!appState.nextCommandName, (
//         <Tooltip placement='bottom' title={`Next: '${appState.nextCommandName}'`} className='cy-tooltip'>
//           <button aria-label={`Next: '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
//             <i className='fas fa-step-forward' />
//           </button>
//         </Tooltip>
//       ))}
//     </div>
//   )
// })

export const EmptyReporterHeader: React.FC = () => {
  return (
    <header>
      {/* <Stats stats={{ numPassed: 0, numFailed: 0, numPending: 0, duration: 0 } as StatsStore} /> */}
    </header>
  )
}
// <li className='passed'>
//   <i aria-hidden="true" className='fas fa-check' />
//   <span className='visually-hidden'>Passed:</span>
//   <span className='num'>{count(stats.numPassed)}</span>
// </li>
// <li className='failed'>
//   <i aria-hidden="true" className='fas fa-times' />
//   <span className='visually-hidden'>Failed:</span>
//   <span className='num'>{count(stats.numFailed)}</span>
// </li>

interface StopRurunButtonProps {
  appState: AppState
  emit: (event: string) => () => void
}

const StopRerunButton = namedObserver('StopRerunButton', ({ emit, appState }: StopRurunButtonProps) => {
  // if (appState.isRunning && !appState.isPaused) {
  return (
    <Tooltip
      placement='bottom'
      title={(
        <p>
Stop Running
          <span className='kbd'>S</span>
        </p>
      )}
      className='cy-tooltip'
      visible={appState.studioActive ? false : null}
    >
      <button aria-label='Stop' className='reporter-button stop' disabled={appState.studioActive} onClick={emit('stop')}>
        <i className='fas fa-stop' />
      </button>
    </Tooltip>
  )
  // }

  if (!appState.isRunning) {
    return (
      <Tooltip
        placement='bottom'
        title={(
          <p>
Run All Tests
            <span className='kbd'>R</span>
          </p>
        )}
        className='cy-tooltip'
      >
        <button aria-label='Rerun all tests' className='reporter-button restart' onClick={emit('restart')}>
          <i className={appState.studioActive ? 'fas fa-undo' : 'fas fa-redo'} />
        </button>
      </Tooltip>
    )
  }
})

interface PlayPauseButtonProps {
  events: Events
  appState: AppState
  emit: (event: string) => () => void
}

const PlayPauseButton = namedObserver('PlayPauseButton', ({ emit, appState, events = defaultEvents }: PlayPauseButtonProps) => {
  const toggleAutoScrolling = () => {
    appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  if (appState.isPaused) {
    return (
      <>
        <span className='paused-label'>
          <label>Paused</label>
        </span>
        <Tooltip placement='bottom' title='Resume' className='cy-tooltip'>
          <button aria-label='Resume' className='play reporter-button' onClick={emit('resume')}>
            <i className='fas fa-play' />
          </button>
        </Tooltip>
      </>
    )
  }

  return (
    <Tooltip placement='bottom' title={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`} className='cy-tooltip'>
      <button
        aria-label={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}
        className={cs('reporter-button', 'toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
        onClick={action('toggle:auto:scrolling', toggleAutoScrolling)}
      >
        <i />
        <i className='fas fa-arrows-alt-v' />
      </button>
    </Tooltip>
  )
})

export const ReporterHeader = namedObserver('ReporterHeader', ({ statsStore, appState, events = defaultEvents }: ReporterHeaderProps) => {
  const emit = (event: string) => () => events.emit(event)

  return (
    <header>
      <div className='header header-lg'>
        <li className='passed'>
          <i aria-hidden="true" className='fas fa-check' />
          <span className='visually-hidden'>Passed:</span>
          <span className='num'>
            {count(statsStore.numPassed)}
          </span>
        </li>

        <li className='failed'>
          <i aria-hidden="true" className='fas fa-times' />
          <span className='visually-hidden'>Failed:</span>
          <span className='num'>
            {count(statsStore.numFailed)}
          </span>
        </li>

        <li className='pending'>
          <i aria-hidden="true" className='fas fa-circle-notch' />
          <span className='visually-hidden'>Pending:</span>
          <span className='num'>
            {count(statsStore.numPending)}
          </span>
        </li>

        <li className='duration'>
          <span className='num'>
            {formatDuration(statsStore.duration)}
          </span>
        </li>

        <li className="p-0">
          <PlayPauseButton
            emit={emit}
            events={events}
            appState={appState}
          />
        </li>

        <li className="p-0">
          <StopRerunButton
            emit={emit}
            appState={appState}
          />
        </li>

      </div>
    </header>
  )
})
