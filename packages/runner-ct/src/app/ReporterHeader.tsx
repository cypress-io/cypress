import * as React from 'react'
import { observer } from 'mobx-react'
import { ReporterHeaderProps } from '@packages/reporter/src/header/header'
// import Stats from '@packages/reporter/src/header/stats'
// import Controls from '@packages/reporter/src/header/controls'
import { StatsStore } from '@packages/reporter/src/header/stats-store'


const count = (num: number) => num > 0 ? num : '--'
const formatDuration = (duration: number) => duration ? String((duration / 1000).toFixed(2)).padStart(5, '0') : '--'

interface StatsProps {
  stats: StatsStore
}

const Stats = observer(({ stats }: StatsProps) => (
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
    <li className='duration'>
      <span className='num'>{formatDuration(stats.duration)}</span>
    </li>
  </ul>
))



import cs from 'classnames'
import { action } from 'mobx'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import defaultEvents, { Events } from '@packages/reporter/src/lib/events'
import { AppState } from '@packages/reporter/src/lib/app-state'
// import { AppState } from '../lib/app-state'

const ifThen = (condition: boolean, component: React.ReactNode) => (
  condition ? component : null
)

interface ControlProps {
  events?: Events
  appState: AppState
}

const Controls = observer(({ events = defaultEvents, appState }: ControlProps) => {
  const emit = (event: string) => () => events.emit(event)
  const toggleAutoScrolling = () => {
    appState.toggleAutoScrolling()
    events.emit('save:state')
  }

  return (
    <div className='controls'>
      {ifThen(appState.isPaused, (
        <span className='paused-label'>
          <label>Paused</label>
        </span>
      ))}
      {ifThen(appState.isPaused, (
        <Tooltip placement='bottom' title='Resume' className='cy-tooltip'>
          <button aria-label='Resume' className='play' onClick={emit('resume')}>
            <i className='fas fa-play' />
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isPaused, (
        <Tooltip placement='bottom' title={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`} className='cy-tooltip'>
          <button
            aria-label={`${appState.autoScrollingEnabled ? 'Disable' : 'Enable'} Auto-scrolling`}
            className={cs('toggle-auto-scrolling', { 'auto-scrolling-enabled': appState.autoScrollingEnabled })}
            onClick={action('toggle:auto:scrolling', toggleAutoScrolling)}
          >
            <i />
            <i className='fas fa-arrows-alt-v' />
          </button>
        </Tooltip>
      ))}
      {ifThen(appState.isRunning && !appState.isPaused, (
        <Tooltip placement='bottom' title={<p>Stop Running <span className='kbd'>S</span></p>} className='cy-tooltip' visible={appState.studioActive ? false : null}>
          <button aria-label='Stop' className='stop' onClick={emit('stop')} disabled={appState.studioActive}>
            <i className='fas fa-stop' />
          </button>
        </Tooltip>
      ))}
      {ifThen(!appState.isRunning, (
        <Tooltip placement='bottom' title={<p>Run All Tests <span className='kbd'>R</span></p>} className='cy-tooltip'>
          <button aria-label='Rerun all tests' className='restart' onClick={emit('restart')}>
            <i className={appState.studioActive ? 'fas fa-undo' : 'fas fa-redo'} />
          </button>
        </Tooltip>
      ))}
      {ifThen(!!appState.nextCommandName, (
        <Tooltip placement='bottom' title={`Next: '${appState.nextCommandName}'`} className='cy-tooltip'>
          <button aria-label={`Next: '${appState.nextCommandName}'`} className='next' onClick={emit('next')}>
            <i className='fas fa-step-forward' />
          </button>
        </Tooltip>
      ))}
    </div>
  )
})

export default Controls



export const EmptyReporterHeader: React.FC = () => {
  return (
    <header>
      {/* <Stats stats={{ numPassed: 0, numFailed: 0, numPending: 0, duration: 0 } as StatsStore} /> */}
    </header>
  )
}

export const ReporterHeader: React.FC<ReporterHeaderProps> = observer(
  function ReporterHeader ({ statsStore, appState }) {
    const oneLine = (
      <div className='header header-lg'>
        <button>1</button>
        <button>2</button>
        <button>3</button>
        <button>4</button>
        <button>5</button>
        <button>6</button>
      </div>
    )

    return (
      <header>
        {oneLine}
        {/* <div>
          <span>1</span>
          <span>2</span>
          <span>3</span>
        </div>
        <div>
          <span>4</span>
          <span>5</span>
          <span>6</span>
        </div>
        <Stats stats={statsStore} />
        <Controlk appState={appState} /> */}
      </header>
    )
  },
)

