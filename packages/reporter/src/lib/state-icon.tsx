import cs from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'

import { TestState } from '@packages/types'
import FailedIcon from '@packages/frontend-shared/src/assets/icons/status-failed_x12.svg'
import PassedIcon from '@packages/frontend-shared/src/assets/icons/status-passed_x12.svg'
import PendingIcon from '@packages/frontend-shared/src/assets/icons/status-pending_x12.svg'
import ProcessingIcon from '@packages/frontend-shared/src/assets/icons/status-processing_x12.svg'
import RunningIcon from '@packages/frontend-shared/src/assets/icons/status-running_x12.svg'
import WandIcon from '@packages/frontend-shared/src/assets/icons/object-magic-wand-dark-mode_x16.svg'

interface Props extends React.HTMLProps<HTMLDivElement> {
  state: TestState
  isStudio?: boolean
}

const StateIcon = observer((props: Props) => {
  const { state, isStudio, ...rest } = props

  if (state === 'active') {
    return (
      <RunningIcon {...rest} className={cs('fa-spin', rest.className)} />
    )
  }

  if (state === 'failed') {
    return (
      <FailedIcon {...rest} />
    )
  }

  if (state === 'passed') {
    if (isStudio) {
      return (
        <WandIcon {...rest} className={cs('wand-icon', rest.className)} viewBox="0 0 16 16" width="12px" height="12px" />
      )
    }

    return (
      <PassedIcon {...rest} />
    )
  }

  if (state === 'pending') {
    return (
      <PendingIcon {...rest} />
    )
  }

  if (state === 'processing') {
    return (
      <ProcessingIcon {...rest} />
    )
  }

  return (
    <PendingIcon />
  )
})

export default StateIcon
