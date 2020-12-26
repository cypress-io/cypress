import { observer } from 'mobx-react'
import React from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import { Events } from './events'
import { AppState } from './app-state'

interface Props {
  appState: AppState
  events: Events
}

const StudioModal = observer(({ appState, events }: Props) => {
  const _close = () => events.emit('studio:close:modal')
  const _start = () => events.emit('studio:start')

  return (
    <Dialog
      className='studio-modal'
      aria-label='Start Studio'
      isOpen={appState.studioModalOpen}
      onDismiss={_close}
    >
      <div className='body'>
        <h1 className='title'>
          <i className='fas fa-magic icon' /> Studio <span className='beta'>BETA</span>
        </h1>
        <div className='gif'>
          <img src={require('../../static/studio.gif')} alt='Studio' />
        </div>
        <div className='center'>
          <div className='text'>
            Generate Cypress commands by interacting with your site on the right. Then, save these commands directly to your test file.
          </div>
          <button className='get-started' onClick={_start}>
            Get Started
          </button>
        </div>
      </div>
      <button className='close-button' onClick={_close}>
        <VisuallyHidden>Close</VisuallyHidden>
        <span aria-hidden>
          <i className='fas fa-times' />
        </span>
      </button>
    </Dialog>
  )
})

export default StudioModal
