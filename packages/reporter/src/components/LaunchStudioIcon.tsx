import React, { MouseEvent } from 'react'

// @ts-ignore
import Tooltip from '@cypress/react-tooltip'
import WandIcon from '@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'

interface LaunchStudioIconProps {
  title: string
  onClick: (e: MouseEvent) => void
}

export const LaunchStudioIcon: React.FC<LaunchStudioIconProps> = ({ title, onClick }) => {
  return (
    <Tooltip
      title={title}
      placement='right'
      className='cy-tooltip'
    >
      <a
        onClick={onClick}
        className='runnable-controls-studio'
        data-cy='launch-studio'
      >
        <WandIcon />
      </a>
    </Tooltip>
  )
}
