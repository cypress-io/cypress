import React from 'react'
import { formatDuration } from '../lib/util'

export const Duration = ({ duration }: { duration: number }) => {
  return Boolean(duration) && (
    <span className='duration' data-cy="spec-duration">{formatDuration(duration)}</span>
  )
}
