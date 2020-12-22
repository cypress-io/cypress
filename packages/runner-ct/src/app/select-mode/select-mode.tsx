import React from 'react'
import { observer } from 'mobx-react'
import { Mode } from '../../lib/state'
import eventManager from '../../lib/event-manager'

interface SelectModeProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

eventManager.on('devserver:specs:changed', () => console.log('Change'))

export const SelectMode = observer(
  function SelectMode(props: SelectModeProps) {
    const handle = () => {
      eventManager.emit('restart')
    }

    return (
      <React.Fragment>
        <div>
          <label htmlFor='workbench'>Workbench</label>
          <input
            type='radio'
            name='select-mode'
            id='workbench'
            checked={props.mode === 'workbench'}
            onClick={() => handle()}
            onChange={() => props.onChange('workbench')}
          />
        </div>

        <div>
          <label htmlFor='watch'>Watch</label>
          <input
            type='radio'
            name='select-mode'
            id='watch'
            checked={props.mode === 'watch'}
            onChange={() => props.onChange('watch')}
          />
        </div>
      </React.Fragment>
    )
  }
)