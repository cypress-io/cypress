import * as React from 'react'
import { observer } from 'mobx-react'
import Runnables, { RunnablesProps } from './runnables'

interface RunnablesMultiSpec extends RunnablesProps {
  isRunning: boolean
}

export const RunnablesMultiSpec: React.FC<RunnablesMultiSpec> = observer(({
  isRunning, runnablesStore, ...other
}) => {
  return (
    <Runnables {...other} runnablesStore={runnablesStore} />
  )
})

RunnablesMultiSpec.displayName = 'RunnablesMultiSpec'
