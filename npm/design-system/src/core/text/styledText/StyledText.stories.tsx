import React from 'react'
import { Story } from '@storybook/react'

import { StyledText as TextComponent } from './StyledText'
import { createStory, createStorybookConfig } from 'stories/util'

import typography from 'css/derived/jsTypography.scss'
import { TextSize } from 'css'
import { lorem } from 'util/lorem'

export default createStorybookConfig({
  title: 'Core/StyledText',
})

const Template: Story = () => (
  <div>
    {Object.keys(typography)
    .filter((key) => !key.startsWith('line-height'))
    .map((key) => {
      return (
        <>
          <h3>
            <TextComponent size="mono-m">{key}</TextComponent>
          </h3>
          <p key={key}>
            <TextComponent size={key.replace('text-', '') as TextSize}>{lorem}</TextComponent>
          </p>
          <hr />
        </>
      )
    })}
  </div>
)

export const StyledText = createStory(Template)

StyledText.storyName = 'StyledText'
