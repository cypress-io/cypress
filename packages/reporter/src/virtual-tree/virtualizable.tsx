import _ from 'lodash'
import React from 'react'

import { Runnable } from '../runnables/runnable-and-suite'
import { SuiteModel } from '../runnables/suite-model'
import { TestFooter } from '../test/test'
import { TestModel, TestFooterModel } from '../test/test-model'
import { Attempt } from '../attempts/attempts'
import { AttemptModel } from '../attempts/attempt-model'
import { Agents } from '../agents/agents'
import { AgentModel } from '../agents/agent-model'
import { Routes } from '../routes/routes'
import { RouteModel } from '../routes/route-model'
import { Hook } from '../hooks/hooks'
import { HookModel } from '../hooks/hook-model'
import { TestError } from '../errors/test-error'
import { Command } from '../commands/command'
import { CommandModel } from '../commands/command-model'
import { Collection } from './virtual-collection'
import { ErrModel } from '../errors/err-model'
import { VirtualizableModel, VirtualizableProps, VirtualizableType } from './virtualizable-types'

interface Props extends VirtualizableProps {
  model: VirtualizableModel
}

export const Virtualizable = ({ index, model, measure, node, onChange, style }: Props) => {
  const wrappedMeasure = () => {
    requestAnimationFrame(() => {
      // console.log('measure')
      measure()
    })
  }
  const virtualizableProps = { index, node, onChange, style, measure: wrappedMeasure }

  switch (model?.virtualType) {
    case VirtualizableType.Suite:
      return <Runnable virtualizableProps={virtualizableProps} model={model as SuiteModel} />
    case VirtualizableType.Test:
      return <Runnable virtualizableProps={virtualizableProps} model={model as TestModel} />
    case VirtualizableType.TestFooter:
      return <TestFooter style={style} model={model as TestFooterModel} />
    case VirtualizableType.Attempt:
      return <Attempt virtualizableProps={virtualizableProps} model={model as AttemptModel} />
    case VirtualizableType.AgentCollection:
      return <Agents virtualizableProps={virtualizableProps} model={model as Collection<AgentModel>} />
    case VirtualizableType.RouteCollection:
      return <Routes virtualizableProps={virtualizableProps} model={model as Collection<RouteModel>} />
    case VirtualizableType.HookCollection:
      return null
    case VirtualizableType.Hook:
      return <Hook virtualizableProps={virtualizableProps} model={model as HookModel} />
    case VirtualizableType.Command:
      return <Command virtualizableProps={virtualizableProps} model={model as CommandModel} />
    case VirtualizableType.Error:
      return <TestError virtualizableProps={virtualizableProps} model={model as ErrModel} />
    case VirtualizableType.RunnablesFooter:
      return <div className='runnables-footer' style={style}><div /></div>
    default:
      return null
  }
}
