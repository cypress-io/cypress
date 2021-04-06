import React from 'react'

import { createStory, createStorybookConfig } from '../../stories/util'

import { CollapsibleGroup as CollapsibleGroupComponent } from './CollapsibleGroup'
import { PaddedBox } from '../../core/surface/paddedBox/PaddedBox'

export default createStorybookConfig({
  title: 'Components/CollapsibleGroup',
})

export const CollapsibleGroup = createStory(() => {
  return (
    <CollapsibleGroupComponent title="Expand me">
      <PaddedBox>
          Collapsible padded box with content
      </PaddedBox>
    </CollapsibleGroupComponent>
  )
})
