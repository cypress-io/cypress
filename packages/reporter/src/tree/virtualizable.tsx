import React, { useEffect } from 'react'

import { Runnable } from '../runnables/runnable-and-suite'
import { SuiteModel } from '../runnables/suite-model'
import { TestModel } from '../test/test-model'
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
import { VirtualNodeModel } from './virtual-node-model'
import { Collection } from './virtual-collection'
import { ExpandableProps } from '../collapsible/expandable'

export enum VirtualizableType {
  Test = 'Test',
  Suite = 'Suite',
  Attempt = 'Attempt',
  AttemptContent = 'AttemptContent',
  AgentCollection = 'AgentCollection',
  RouteCollection = 'RouteCollection',
  HookCollection = 'HookCollection',
  Hook = 'Hook',
  Command = 'Command',
  Error = 'Error',
}

export interface Virtualizable {
  virtualType: VirtualizableType
  virtualNode: VirtualNodeModel
}

export interface VirtualizableProps extends ExpandableProps {
  style: React.CSSProperties
  model: Virtualizable
}

export const Virtualizable = ({ style, model, node, measure, onChange, index }: VirtualizableProps) => {
  // useEffect(() => {
  //   console.log('-> mount', model.virtualType, node.id)

  //   return () => {
  //     console.log('<- unmount', model.virtualType, node.id)
  //   }
  // }, [true])

  // TODO: rename expandableProps to something more generic, like virtualizableProps
  const expandableProps = { node, measure, onChange, index }

  switch (model?.virtualType) {
    case VirtualizableType.Suite:
      return <Runnable model={model as SuiteModel} style={style} expandableProps={expandableProps} />
    case VirtualizableType.Test:
      return <Runnable model={model as TestModel} style={style} expandableProps={expandableProps} />
    case VirtualizableType.Attempt:
      return <Attempt model={model as AttemptModel} style={style} expandableProps={expandableProps} />
    case VirtualizableType.AgentCollection:
      return <Agents model={model as Collection<AgentModel>} style={style} measure={expandableProps.measure} />
    case VirtualizableType.RouteCollection:
      return <Routes model={model as Collection<RouteModel>} style={style} measure={expandableProps.measure} />
    case VirtualizableType.HookCollection:
      return null
    case VirtualizableType.Hook:
      return <Hook style={style} model={model as HookModel} expandableProps={expandableProps} />
    case VirtualizableType.Command:
      return <Command style={style} model={model as CommandModel} expandableProps={expandableProps} />
    case VirtualizableType.Error:
      return <TestError style={style} model={model as AttemptModel} />
    default:
      return null
  }
}
