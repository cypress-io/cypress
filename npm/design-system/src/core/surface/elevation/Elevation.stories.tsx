import * as React from 'react'

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

export const Elevation = createStory<{
  elevation: SurfaceElevation
}>(({ elevation }) => (
  <div>
    <ElevationComponent elevation={elevation}>
      {lorem}
    </ElevationComponent>
    <br />
    <StoryHighlightWrapper>
      <ElevationComponent elevation={elevation}>
        {lorem}
      </ElevationComponent>
    </StoryHighlightWrapper>
  </div>
), {
  elevation: 'bordered',
})
