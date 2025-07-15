import React from 'react'
import { observer } from 'mobx-react'
import { getFilenameParts } from '../lib/util'
import Button from '@cypress-design/react-button'
import { IconArrowLeft } from '@cypress-design/react-icon'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'

// this is set up to be stubbed in tests
export const TestActions = {
  handleBackButton: () => {
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(url.hash)

    hashParams.delete('studio')

    ;['testId', 'suiteId'].forEach((param) => {
      hashParams.delete(param)
    })

    url.hash = decodeURIComponent(hashParams.toString())
    window.history.replaceState({}, '', url.toString())
    window.location.reload()
  },
}

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

  return (
    <>
      <header className='studio-header'>
        <div className='studio-header__file-section'>
          <Button data-cy='studio-back-button' size='32' variant='outline-dark' className='studio-header__back-button' onClick={TestActions.handleBackButton}>
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
