import React from 'react'
import SparkleIcon from '@packages/frontend-shared/src/assets/icons/sparkle_x16.svg'
import cs from 'classnames'

export const SelfHealedBadge = ({ source }: { source: 'command' | 'test' }) => {
  return (
    <div className={cs('command-self-healed-badge', { 'command-self-healed-badge-command': source === 'command' })} data-cy={`self-healed-badge-${source}`}>
      <SparkleIcon />
      <span>
        Self-healed
      </span>
    </div>
  )
}
