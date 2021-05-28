import React from 'react'

import { createStory, createStorybookConfig } from '../../stories/util'

import { CollapsibleGroup as CollapsibleGroupComponent } from './CollapsibleGroup'
import { PaddedBox } from '../../core/surface/paddedBox/PaddedBox'

export default createStorybookConfig({
  title: 'Components/CollapsibleGroup',
})

export const CollapsibleGroup = createStory(() => {
  return (
    <div>
      <CollapsibleGroupComponent title="Expand me">
        <PaddedBox>
        Collapsible padded box with content
        </PaddedBox>
      </CollapsibleGroupComponent>
      <CollapsibleGroupComponent title="Defaults to open" defaultExpanded={true}>
        <PaddedBox>
          Collapsible padded box with content
        </PaddedBox>
      </CollapsibleGroupComponent>
    </div>
  )
})

export const Icons = createStory(() => {
  return (
    <div>
      <CollapsibleGroupComponent title="Expand me" icons={{ expanded: 'chevron-down', collapsed: 'chevron-right' }}>
        <PaddedBox>
        Collapsible padded box with content
        </PaddedBox>
      </CollapsibleGroupComponent>
      <CollapsibleGroupComponent title="Defaults to open" defaultExpanded={true}>
        <PaddedBox>
          Collapsible padded box with content
        </PaddedBox>
      </CollapsibleGroupComponent>
    </div>
  )
})
