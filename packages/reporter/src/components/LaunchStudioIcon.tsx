import React, { MouseEvent } from 'react'

import Tooltip from '@cypress/react-tooltip'
import { IconChevronRightMedium } from '@cypress-design/react-icon'

interface LaunchStudioIconProps {
  content: React.ReactNode
  onClick: (e: MouseEvent) => void
}

export const LaunchStudioIcon: React.FC<LaunchStudioIconProps> = ({ content, onClick }) => {
  return (
    <Tooltip
      placement='right'
      className='cy-tooltip'
      title={content}
    >
      <a
        onClick={onClick}
        className='runnable-controls-studio'
        data-cy='launch-studio'
      >
        <IconChevronRightMedium style={{ marginTop: '-1px' }} />
      </a>
    </Tooltip>
  )
}
