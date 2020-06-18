import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'

import ipc from '../lib/ipc'

import { FileOpener as Opener } from '@packages/ui-components'

const openFile = (where, { absoluteFile: file, line, column }) => {
  ipc.openFile({
    where,
    file,
    line,
    column,
  })
}

const getUserEditor = (callback) => {
  ipc.getUserEditor().then(callback)
}

const FileOpener = observer((props) => {
  const fileDetails = {
    column: 0,
    line: 0,
    ...props.fileDetails,
  }

  return (
    <Opener
      fileDetails={fileDetails}
      openFile={openFile}
      getUserEditor={getUserEditor}
      setUserEditor={ipc.setUserEditor}
      className={props.className}
    >
      <span><i className="fas fa-external-link-alt fa-sm" /> Open in IDE</span>
    </Opener>
  )
})

const fileDetails = PropTypes.shape({
  absoluteFile: PropTypes.string.isRequired,
  originalFile: PropTypes.string.isRequired,
  relativeFile: PropTypes.string.isRequired,
})

FileOpener.propTypes = {
  fileDetails: fileDetails.isRequired,
  className: PropTypes.string,
}

export default FileOpener
