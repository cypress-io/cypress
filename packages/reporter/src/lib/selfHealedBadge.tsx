import React from 'react'
import SparkleIcon from '@packages/frontend-shared/src/assets/icons/sparkle_x16.svg'

export const SelfHealedBadge = ({ source }: { source: 'command' | 'hook' | 'test' }) => {
  return (
    <div className='command-self-healed-badge' data-cy={`self-healed-badge-${source}`}>
      <SparkleIcon />
      <span>
        Self-healed
      </span>
    </div>
  )
}
