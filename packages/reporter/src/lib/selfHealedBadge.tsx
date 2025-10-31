import React from 'react'
import { IconGeneralSparkleSingleSmall } from '@cypress-design/react-icon'
import cs from 'classnames'

export const SelfHealedBadge = ({ source }: { source: 'command' | 'test' }) => {
  return (
    <div className={cs('command-self-healed-badge', { 'command-self-healed-badge-command': source === 'command', 'command-self-healed-badge-test': source === 'test' })} data-cy={`self-healed-badge-${source}`}>
      <IconGeneralSparkleSingleSmall strokeColor='jade-300' fillColor='gray-1000' />
      <span>
        Self-healed
      </span>
    </div>
  )
}
