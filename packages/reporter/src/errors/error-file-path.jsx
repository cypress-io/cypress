import React from 'react'
import Tooltip from '@cypress/react-tooltip'

const FileOptions = ({ fileDetails, onOpenComputer, onOpenEditor }) => (
  <>
    <button onClick={() => onOpenComputer(fileDetails)}>Open on Computer</button>
    <button onClick={() => onOpenEditor(fileDetails)}>Open in Editor</button>
  </>
)

const ErrorFilePath = (props) => {
  const { relativeFile, line, column } = props.fileDetails

  return (
    <span className='runnable-err-file-path'>
      <Tooltip title={<FileOptions {...props} />} className='err-file-options tooltip'>
        <span>{relativeFile}:{line}:{column}</span>
      </Tooltip>
    </span>
  )
}

export default ErrorFilePath
