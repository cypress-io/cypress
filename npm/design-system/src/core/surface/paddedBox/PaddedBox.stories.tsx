import * as React from 'react'

import { createStory, createStorybookConfig } from 'stories/util'

import { PaddedBox as PaddedComponent } from './PaddedBox'
import { lorem } from 'util/lorem'
import { StoryHighlightWrapper } from 'util/storybook/storyHighlightWrapper/StoryHighlightWrapper'
import type { Spacing } from 'css'

import spacing from 'css/derived/jsSpacing.scss'

export default createStorybookConfig({
  title: 'Core/Surfaces/PaddedBox',
  argTypes: {
    padding: {
      control: {
        type: 'select',
        options: Object.keys(spacing).map((key) => key.replace('space-', '')),
      },
    },
  },
})

export const PaddedBox = createStory<{
    padding: Spacing
  }>(({ padding }) => (
    <div>
      <StoryHighlightWrapper>
        <PaddedComponent padding={padding}>
          {lorem}
        </PaddedComponent>
      </StoryHighlightWrapper>
    </div>
  ), {
    padding: 'm',
  })

// Required to prevent Storybook from separating into two words and creating unnecessary nesting
PaddedBox.storyName = 'PaddedBox'
