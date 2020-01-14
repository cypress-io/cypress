import { observer } from 'mobx-react'
import React from 'react'
// @ts-ignore
import Tooltip from '@cypress/react-tooltip'

interface Props {
  show: boolean
}

const ForcedGcWarning = observer(({ show }: Props) => (
  <header>
    <Tooltip placement='bottom' title={<p>View All Tests <span className='kbd'>F</span></p>} wrapperClassName='focus-tests'>
      <button onClick={() => events.emit('focus:tests')}>
        <i className='fas fa-chevron-left'></i>
        <span>Tests</span>
      </button>
    </Tooltip>
    <Stats stats={statsStore} />
    <div className='spacer' />
    <Controls appState={appState} />
  </header>
))

export default ForcedGcWarning
