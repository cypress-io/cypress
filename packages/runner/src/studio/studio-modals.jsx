import { observer } from 'mobx-react'
import React, { useState } from 'react'
import { Dialog } from '@reach/dialog'
import VisuallyHidden from '@reach/visually-hidden'

import eventManager from '../lib/event-manager'
import studioRecorder from './studio-recorder'

const StudioInitModal = observer(() => {
  const _close = () => {
    studioRecorder.closeInitModal()
    studioRecorder.clearRunnableIds()
  }
  const _start = () => eventManager.emit('studio:start')

  return (
    <Dialog
      className='studio-modal'
      aria-label='Start Studio'
      isOpen={studioRecorder.initModalIsOpen}
      onDismiss={_close}
    >
      <div className='body'>
        <h1 className='title'>
          <i className='fas fa-magic icon' /> Studio <span className='beta'>BETA</span>
        </h1>
        <div className='gif'>
          <img src={require('../../static/studio.gif')} alt='Studio' />
        </div>
        <div className='content center'>
          <div className='text'>
            Generate Cypress commands by interacting with your site on the right. Then, save these commands directly to your test file.
          </div>
          <button className='btn-main' onClick={_start}>
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

const StudioSaveModal = observer(() => {
  const [name, setName] = useState('')

  const _close = studioRecorder.closeSaveModal

  const _save = (e) => {
    e.preventDefault()

    if (!name) return

    studioRecorder.save(name)
  }

  return (
    <Dialog
      className='studio-modal studio-save-modal'
      aria-label='Start Studio'
      isOpen={studioRecorder.saveModalIsOpen}
      onDismiss={_close}
    >
      <div className='body'>
        <h1 className='title'>
          <i className='fas fa-magic icon' /> Save New Test
        </h1>
        <div className='content'>
          <form onSubmit={_save}>
            <div className='text'>
              <label className='text-strong' htmlFor='testName'>Test Name</label>
              <input id='testName' type='text' value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className='center'>
              <button className='btn-main' type='submit' disabled={!name}>
                Save Test
              </button>
            </div>
          </form>
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

const StudioModals = observer(() => (
  <>
    <StudioInitModal />
    <StudioSaveModal />
  </>
))

export default StudioModals
