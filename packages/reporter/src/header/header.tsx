import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

import MenuExpandRightIcon from '@packages/frontend-shared/src/assets/icons/menu-expand-right_x16.svg'

import defaultEvents, { Events } from '../lib/events'
import { AppState } from '../lib/app-state'
import { action } from 'mobx'

import Controls from './controls'
import Stats from './stats'
import { StatsStore } from './stats-store'
import { DebugDismiss } from './DebugDismiss'
import { RunnablesStore } from '../runnables/runnables-store'

export interface ReporterHeaderProps {
  appState: AppState
  events?: Events
  statsStore: StatsStore
  runnablesStore: RunnablesStore
}

const Header = observer(({ appState, events = defaultEvents, statsStore, runnablesStore }: ReporterHeaderProps) => (
  <header>
    <Tooltip placement='bottom' title={<p>{appState.isSpecsListOpen ? 'Collapse' : 'Expand'} Specs List <span className='kbd'>F</span></p>} wrapperClassName='toggle-specs-wrapper' className='cy-tooltip'>
      <button
        aria-controls="reporter-inline-specs-list"
        aria-expanded={appState.isSpecsListOpen}
        onClick={() => {
          action('toggle:spec:list', () => {
            appState.toggleSpecList()
            events.emit('save:state')
          })()
        }
        }>
        <MenuExpandRightIcon style={{ transform: appState.isSpecsListOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />

        <span className='toggle-specs-text'>Specs</span>
      </button>
    </Tooltip>
    <div className='spacer' />
    {runnablesStore.testFilter && runnablesStore.totalTests > 0 && <DebugDismiss matched={runnablesStore.totalTests} total={runnablesStore.totalUnfilteredTests} />}
    <Stats stats={statsStore} />
    <Controls appState={appState} />
  </header>
))

export default Header
