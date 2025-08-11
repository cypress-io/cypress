import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import Button from '@cypress-design/react-button'
import defaultEvents, { Events } from '../lib/events'
import type { AppState } from '../lib/app-state'
import { action } from 'mobx'
import type { StatsStore } from './stats-store'
import type { RunnablesStore } from '../runnables/runnables-store'
import RunnableHeader from '../runnables/runnable-header'
import MenuExpandRightIcon from '@packages/frontend-shared/src/assets/icons/menu-expand-right_x16.svg'
import Stats from './stats'
import Controls from './controls'

export interface ReporterHeaderProps {
  appState: AppState
  events?: Events
  statsStore: StatsStore
  runnablesStore: RunnablesStore
  spec?: Cypress.Cypress['spec']
}

const Header: React.FC<ReporterHeaderProps> = observer(({ appState, events = defaultEvents, statsStore, runnablesStore, spec }: ReporterHeaderProps) => {
  return <header>
    <div className='spec-container'>
      <Tooltip placement='bottom' title={<p>{appState.isSpecsListOpen ? 'Collapse' : 'Expand'} Specs List <span className='kbd'>F</span></p>} wrapperClassName='toggle-specs-wrapper' className='cy-tooltip'>
        <div>
          <Button
            data-cy='toggle-specs-button'
            size='32'
            className='toggle-specs-button'
            variant='outline-dark'
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
          </Button>
        </div>
      </Tooltip>
      {spec && <RunnableHeader spec={spec} statsStore={statsStore} runnablesStore={runnablesStore} />}
    </div>
    <div className='statsAndControls'>
      <Stats stats={statsStore} />
      <Controls appState={appState} />
    </div>
  </header>
})

Header.displayName = 'Header'

export default Header
