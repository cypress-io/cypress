import React from 'react'
import { FlattenedNode, NodeAction } from 'react-virtualized-tree'

import { VirtualNodeModel } from './virtual-node-model'

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

export interface VirtualizableModel {
  virtualType: VirtualizableType
  virtualNode: VirtualNodeModel
}

export interface VirtualizableProps {
  node: FlattenedNode
  measure: () => void
  onChange: (udpateParams: NodeAction) => void
  index: number
  style: React.CSSProperties
}
