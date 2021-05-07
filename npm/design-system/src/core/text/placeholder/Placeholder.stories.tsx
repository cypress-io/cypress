import React from 'react'

import { Placeholder as PlaceholderComponent } from './Placeholder'
import { createStory, createStorybookConfig } from 'stories/util'

import { lorem } from 'util/lorem'

export default createStorybookConfig({
  title: 'Core/Placeholder',
})

export const StyledText = createStory(() => (
  <div>
    <div>
      <PlaceholderComponent>This is placeholder text</PlaceholderComponent>
    </div>
    <div>
      <PlaceholderComponent>{lorem}</PlaceholderComponent>
    </div>
  </div>
))
