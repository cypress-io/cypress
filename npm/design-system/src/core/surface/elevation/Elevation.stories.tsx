import React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from 'stories/util'

import { Elevation as ElevationComponent } from './Elevation'
import { lorem } from 'util/lorem'
import { StoryHighlightWrapper } from 'util/storybook/storyHighlightWrapper/StoryHighlightWrapper'
import { SurfaceElevation } from 'css'

import surfaces from 'css/derived/jsSurfaces.scss'

export default createStorybookConfig({
  title: 'Core/Surfaces/Elevation',
  argTypes: {
    elevation: {
      control: {
        type: 'select',
        options: Object.keys(surfaces).map((key) => key.replace('shadow-', '')),
      },
    },
  },
})

const Template: Story<{
  elevation: SurfaceElevation
}> = ({ elevation }) => (
  <div>
    <ElevationComponent elevation={elevation}>{lorem}</ElevationComponent>
    <br />
    <StoryHighlightWrapper>
      <ElevationComponent elevation={elevation}>{lorem}</ElevationComponent>
    </StoryHighlightWrapper>
  </div>
)

export const Elevation = createStory(Template, {
  elevation: 'bordered',
})
