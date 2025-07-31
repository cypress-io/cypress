import React from 'react'
import { getFilenameParts } from '../lib/util'
import { OpenFileInIDEButton } from '../header/OpenFileInIDEButton'
import { CreateNewTestButton } from '../header/CreateNewTestButton'

const displayFileName = (spec: Cypress.Cypress['spec']) => {
  const specParts = getFilenameParts(spec.name)

  return (
    <>
      <span className='spec-name'>{specParts[0]}</span><span className='spec-file-extension'>{specParts[1]}</span>
    </>
  )
}

export const SpecFileName = ({ spec }: { spec: Cypress.Cypress['spec'] }) => {
  const relativeSpecPath = spec.relative

  const fileDetails = {
    absoluteFile: spec.absolute,
    column: 0,
    displayFile: displayFileName(spec),
    line: 0,
    originalFile: relativeSpecPath,
    relativeFile: relativeSpecPath,
  }

  return <div className='spec-file-name'>
    {fileDetails.displayFile || fileDetails.originalFile}{!!fileDetails.line && `:${fileDetails.line}`}{!!fileDetails.column && `:${fileDetails.column}`}
    <OpenFileInIDEButton fileDetails={fileDetails} />
    <CreateNewTestButton suiteId='r1' dataCy='create-new-test-from-spec-header' />
  </div>
}
