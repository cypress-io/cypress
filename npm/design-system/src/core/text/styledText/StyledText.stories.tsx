import React from 'react'

import { StyledText as TextComponent } from './StyledText'
import { createStory, createStorybookConfig } from 'stories/util'

import typography from 'css/derived/jsTypography.scss'
import { TextSize } from 'css'
import { lorem } from 'util/lorem'

export default createStorybookConfig({
  title: 'Core/StyledText',
  excludeStories: ['styledTextWithSizes'],
})

export const styledTextWithSizes = (sizes: string[]) =>
  sizes
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
  })

export const StyledText = createStory(() => <div>{styledTextWithSizes(Object.keys(typography))}</div>)

StyledText.storyName = 'StyledText'
