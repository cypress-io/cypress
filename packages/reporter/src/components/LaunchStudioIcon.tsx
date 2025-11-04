import React, { MouseEvent } from 'react'

import Tooltip from '@cypress/react-tooltip'
import { IconChevronRightMedium } from '@cypress-design/react-icon'
import cx from 'classnames'

interface LaunchStudioIconProps {
  content: React.ReactNode
  onClick: (e: MouseEvent) => void
  wrapperClassName?: string
  className?: string
  visible?: boolean
}

export const LaunchStudioIcon: React.FC<LaunchStudioIconProps> = ({ content, onClick, className, wrapperClassName, visible }) => {
  return (
    <Tooltip
      placement='right'
      className={cx(className, 'cy-tooltip')}
      title={content}
      visible={visible}
    >
      <a
        onClick={onClick}
        className={cx('runnable-controls-studio', wrapperClassName)}
        data-cy='launch-studio'
      >
        <IconChevronRightMedium style={{ marginTop: '-1px' }} />
      </a>
    </Tooltip>
  )
}
