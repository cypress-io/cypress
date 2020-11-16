import { action } from 'mobx'
import React, { ReactNode } from 'react'
import { renderers, FlattenedNode, NodeAction } from 'react-virtualized-tree'

export const VirtualExpandable = renderers.Expandable

// TODO: move this to VirtualNodeProps
export interface ExpandableProps {
  node: FlattenedNode
  measure: () => void
  onChange: (udpateParams: NodeAction) => void
  index: number
}

interface Props {
  children: ReactNode
  expandableProps: ExpandableProps
}

export const Expandable = ({ children, expandableProps }: Props) => {
  const { node } = expandableProps

  const toggle = action(() => {
    node.state!.expanded = !node.state!.expanded
  })

  const icon = node.state!.expanded ? 'fa-caret-down' : 'fa-caret-right'

  return (
    <VirtualExpandable {...expandableProps}>
      <div className='expandable' onClick={toggle}>
        <i className={`collapsible-indicator fa-fw fas ${icon}`} />
        {children}
      </div>
    </VirtualExpandable>
  )
}
