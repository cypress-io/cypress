import React, { useCallback } from 'react'
import { observer } from 'mobx-react'
import { getFilenameParts } from '../lib/util'
import Button from '@cypress-design/react-button'
import { IconArrowLeft } from '@cypress-design/react-icon'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'
import events from '../lib/events'

interface StudioHeaderProps {
  spec: Cypress.Cypress['spec']
}

export const StudioTestHeader = observer(({ spec }: StudioHeaderProps) => {
  const specParts = getFilenameParts(spec.name)
  const relativeSpecPath = spec.relative

  const fileDetails = {
    absoluteFile: spec.absolute,
    column: 0,
    line: 0,
    originalFile: relativeSpecPath,
    relativeFile: relativeSpecPath,
  }

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
          <div className='studio-header__file-content'>
            <span data-cy='studio-single-test-file-name' className='studio-header__file-name'>{specParts[0]}{specParts[1]}</span>
            <OpenFileInIDEButton fileDetails={fileDetails} />
          </div>
        </div>
      </header>
    </>
  )
})
