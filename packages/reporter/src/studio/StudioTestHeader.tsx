import React, { useCallback } from 'react'
import { observer } from 'mobx-react'
import Button from '@cypress-design/react-button'
import { IconArrowLeft } from '@cypress-design/react-icon'
import events from '../lib/events'
import { SpecFileName } from '../shared/SpecFileName'

interface StudioHeaderProps {
  spec: Cypress.Cypress['spec']
}

export const StudioTestHeader = observer(({ spec }: StudioHeaderProps) => {
  const handleBackButton = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    events.emit('studio:cancel', undefined)
  }, [])

  return (
    <>
      <header className='studio-header'>
        <div className='studio-header__file-section'>
          <Button data-cy='studio-back-button' size='32' variant='outline-dark' className='studio-header__back-button' onClick={handleBackButton}>
            <IconArrowLeft size='16' strokeColor='gray-500' />
          </Button>
          <SpecFileName spec={spec} />
        </div>
      </header>
    </>
  )
})
