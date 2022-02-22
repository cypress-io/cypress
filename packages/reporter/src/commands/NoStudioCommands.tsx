import React from 'react'

import ArrowRightIcon from '-!react-svg-loader!@packages/frontend-shared/src/assets/icons/arrow-right_x16.svg'

// This will likely need re-factored when studio support is re-introduced.
const NoStudioCommands = () => (
  <li className='command command-name-get'>
    <div className='command-wrapper command-state-pending command-type-parent studio-prompt'>
      <div className='command-wrapper-text'>
        <span className='command-message'>
          <span className='command-message-text'>
              Interact with your site to add test commands. Right click to add assertions.
          </span>
        </span>
        <span className='command-controls'>
          <ArrowRightIcon />
        </span>
      </div>
    </div>
  </li>
)

export default NoStudioCommands
