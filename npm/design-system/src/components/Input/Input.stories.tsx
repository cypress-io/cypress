import * as React from 'react'
import { Story } from '@storybook/react'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Input as InputComponent } from './Input'

export default createStorybookConfig({
  title: 'Components/Input',
})

const Template: Story = () => (
  <div>
    <InputComponent />
    <InputComponent label={{
      type: 'tag',
      contents: 'Labeled input',
    }}
    />
  </div>
)

export const Input = createStory(Template)
