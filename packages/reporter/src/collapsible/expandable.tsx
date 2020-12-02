import { action } from 'mobx'
import React, { ReactNode } from 'react'
import { renderers } from 'react-virtualized-tree'

import { VirtualizableProps } from '../virtual-tree/virtualizable-types'

export const VirtualExpandable = renderers.Expandable

interface Props {
  children: ReactNode
  virtualizableProps: VirtualizableProps
}

export const Expandable = ({ children, virtualizableProps }: Props) => {
  const { node } = virtualizableProps

  const toggle = action(() => {
    node.state!.expanded = !node.state!.expanded
  })

  const icon = node.state!.expanded ? 'fa-caret-down' : 'fa-caret-right'

  return (
    <VirtualExpandable {...virtualizableProps}>
      <div className='expandable' onClick={toggle}>
        <i className={`collapsible-indicator fa-fw fas ${icon}`} />
        {children}
      </div>
    </VirtualExpandable>
  )
}
