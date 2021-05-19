import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from 'stories/util'

import { PaddedBox as PaddedComponent } from './PaddedBox'
import { lorem } from 'util/lorem'
import { StoryHighlightWrapper } from 'util/storybook/storyHighlightWrapper/StoryHighlightWrapper'
import { Spacing } from 'css'

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

const Template: Story<{
  padding: Spacing
}> = ({ padding }) => (
  <div>
    <StoryHighlightWrapper>
      <PaddedComponent padding={padding}>
        {lorem}
      </PaddedComponent>
    </StoryHighlightWrapper>
  </div>
)

export const PaddedBox = createStory(Template, {
  padding: 'm',
})

// Required to prevent Storybook from separating into two words and creating unnecessary nesting
PaddedBox.storyName = 'PaddedBox'
