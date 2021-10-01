import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import React from 'react'

import { FileOpener as Opener, FileDetails } from '../lib/file-opener'

const SpecFileOpener = observer((props) => {
  return (
    <Opener
      fileDetails={props.fileDetails}
      className={props.className}
    >
      <span>
        <i className="fas fa-external-link-alt fa-sm" /> Open in IDE
      </span>
    </Opener>
  )
})

SpecFileOpener.propTypes = {
  fileDetails: FileDetails.isRequired,
  className: PropTypes.string,
}

export default SpecFileOpener
