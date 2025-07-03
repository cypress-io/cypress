import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import type { TestState } from '@packages/types'
import WandIcon from '@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'
import { IconStatusFailedSimple, IconStatusPassedSimple, IconStatusQueuedOutline, IconStatusQueuedSimple, IconStatusRunningOutline, IconStatusRunningSimple, IconStatusSkippedOutline, IconStatusSkippedSimple } from '@cypress-design/react-icon'

interface Props extends React.SVGProps<SVGSVGElement> {
  state: TestState
  isStudio?: boolean
  iconSize?: '8' | '12' | '16'
}

const StateIcon: React.FC<Props> = observer((props: Props) => {
  const { state, isStudio, ref, iconSize, ...rest } = props

  if (state === 'active') {
    return (
      iconSize === '8' ?
        <IconStatusRunningSimple {...rest} size='8' fillColor='gray-700' strokeColor='indigo-400' /> :
        <IconStatusRunningOutline {...rest} size={iconSize || '16'} fillColor='gray-700' strokeColor='indigo-400' />
    )
  }

  if (state === 'failed') {
    return (
      <IconStatusFailedSimple {...rest} size={iconSize || '16'} strokeColor='red-400' />
    )
  }

  if (state === 'passed') {
    if (isStudio) {
      return (
        <WandIcon {...rest} className={cs('wand-icon', rest.className)} viewBox="0 0 16 16" width="12px" height="12px" />
      )
    }

    return (
      <IconStatusPassedSimple {...rest} size={iconSize || '16'} strokeColor='jade-400' />
    )
  }

  // pending is really skipped
  if (state === 'pending') {
    return (
      iconSize === '8' ?
        <IconStatusSkippedSimple {...rest} size='8' strokeColor='gray-700' /> :
        <IconStatusSkippedOutline {...rest} size={iconSize || '16'} strokeColor='gray-700' />
    )
  }

  // processing is really queued
  if (state === 'processing') {
    return (
      iconSize === '8' ?
        <IconStatusQueuedSimple {...rest} size='8' strokeColor='gray-700' /> :
        <IconStatusQueuedOutline
          {...rest}
          size={iconSize || '16'}
          strokeColor="gray-700" />
    )
  }

  return (
    iconSize === '8' ?
      <IconStatusQueuedSimple {...rest} size='8' strokeColor='gray-700' /> :
      <IconStatusQueuedOutline
        {...rest}
        size={iconSize || '16'}
        strokeColor="gray-700" />
  )
})

StateIcon.displayName = 'StateIcon'

export default StateIcon
