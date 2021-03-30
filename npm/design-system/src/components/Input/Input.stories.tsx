import * as React from 'react'
import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Input as InputComponent } from './Input'
import { IconInput as IconInputComponent } from './IconInput'

export default createStorybookConfig({
  title: 'Components/Input',
})

export const Input = createStory(() => (
  <div>
    <InputComponent />
    <InputComponent label={{
      type: 'tag',
      contents: 'Labeled input',
    }}
    />
  </div>
))

export const Icon = createStory(() => (
  <div>
    <IconInputComponent
      prefixIcon={{
        icon: 'home',
        onClick: action('onPrefixClick'),
      }}
      suffixIcon={{
        icon: 'times',
        onClick: action('onSuffixClick'),
      }}
    />
  </div>
))
