import * as React from 'react'
import { Story } from '@storybook/react'

import { Text as TextComponent } from './Text'
import { createStory, createStorybookConfig } from '../../stories/util'

import typography from '../../css/derived/jsTypography.scss'
import { TextSize } from '../../css'

export default createStorybookConfig({
  title: 'Core/Text',
})

const lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut tempus dapibus mi. Sed convallis interdum aliquet.' +
  ' Donec pellentesque felis non diam finibus, ac interdum orci tincidunt. Nam a nunc non mi auctor congue. Mauris id tempus urna.'

const Template: Story = () => (
  <div>
    {Object.keys(typography).filter((key) => !key.startsWith('line-height')).map((key) => {
      return (
        <>
          <h3>
            <TextComponent size='mono-m'>
              {key}
            </TextComponent>
          </h3>
          <p key={key}>
            <TextComponent size={key.replace('text-', '') as TextSize}>
              {lorem}
            </TextComponent>
          </p>
          <hr />
        </>
      )
    })}
  </div>
)

export const Text = createStory(Template)
